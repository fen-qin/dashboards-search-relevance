/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import { EuiFlexItem, EuiFlexGroup, EuiTitle, EuiSpacer, EuiLoadingSpinner } from '@elastic/eui';
import { withRouter } from 'react-router-dom';
import { ConfigurationForm } from './configuration_form';
import { ConfigurationActions } from './configuration_action';
import {
  TemplateConfigurationProps,
  ConfigurationFormData,
  SearchConfigFromData,
  ExperimentType,
} from './types';
import { SearchConfigForm } from './search_configuration_form';
import { ServiceEndpoints } from '../../../../common';
import { useOpenSearchDashboards } from '../../../../../../src/plugins/opensearch_dashboards_react/public';

export const TemplateConfiguration = ({
  templateType,
  onBack,
  onClose,
  history,
}: TemplateConfigurationProps) => {
  /**
   * Config Form will collect querySetId along with other experiment_type related fields to generate judgments.
   */
  const [configFormData, setConfigFormData] = useState<ConfigurationFormData | null>(null);
  /**
   * Search Config Form will collect pairs of searchConfigurationId + index
   */
  const [searchConfigData, setSearchConfigData] = useState<SearchConfigFromData>({
    searchConfigs: [],
  });

  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [showEvaluation, setShowEvaluation] = useState(false);

  const handleConfigSave = (data: ConfigurationFormData) => {
    setConfigFormData(data);
  };

  const handleSearchConfigChange = (data: SearchConfigFromData) => {
    setSearchConfigData(data);
  };

  const {
    services: { http, notifications },
  } = useOpenSearchDashboards();

  const getExperimentType = (templateType: string): ExperimentType => {
    switch (templateType) {
      case 'Result List Comparison':
        return ExperimentType.PAIRWISE_COMPARISON;
      case 'LLM':
        return ExperimentType.LLM_EVALUATION;
      case 'User Behavior':
        return ExperimentType.UBI_EVALUATION;
      default:
        throw new Error(`Unsupported template type: ${templateType}`);
    }
  };

  const validateExperimentData = (
    configFormData: any,
    searchConfigData: any,
    templateType: string
  ) => {
    const errors: string[] = [];

    if (!configFormData?.k || configFormData.k <= 0) {
      errors.push('K value is required and must be greater than 0');
    }
    if (!configFormData?.querySets || configFormData.querySets.length === 0) {
      errors.push('Query set is required');
    }
    if (!searchConfigData?.searchConfigs || searchConfigData.searchConfigs.length === 0) {
      errors.push('At least one search configuration is required');
    }

    // Template specific validations
    if (
      templateType === 'LLM' &&
      (!configFormData?.modelId || configFormData.modelId.trim() === '')
    ) {
      errors.push('Model ID is required for LLM experiments');
    }
    if (
      templateType === 'User Behavior' &&
      (!configFormData?.judgmentId || configFormData.judgmentId.trim() === '')
    ) {
      errors.push('Judgment ID is required for User Behavior experiments');
    }

    return errors;
  };

  const handleNext = async () => {
    const validationErrors = validateExperimentData(configFormData, searchConfigData, templateType);

    if (validationErrors.length > 0) {
      // Show all validation errors in a single toast
      notifications.toasts.addDanger({
        title: 'Validation Error',
        text: (
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        ),
      });
      return;
    }

    if (configFormData && searchConfigData.searchConfigs.length > 0) {
      const combinedData = {
        ...configFormData,
        ...searchConfigData,
      };
      try {
        setIsCreating(true);
        const requestBody: any = {
          k: combinedData.k,
          querySetId: combinedData.querySets[0].value,
          searchConfigurationList: combinedData.searchConfigs.map((o) => o.value),
          type: getExperimentType(templateType),
        };
        // Add modelId if the template type is LLM
        if (templateType === 'LLM' && 'modelId' in configFormData) {
          requestBody.modelId = configFormData.modelId;
        }
        // Add judgmentId if the template type is User Behavior
        if (templateType === 'User Behavior' && 'judgmentId' in configFormData) {
          requestBody.judgmentId = configFormData.judgmentId;
        }
        const response = await http.post(ServiceEndpoints.Experiments, {
          body: JSON.stringify(requestBody),
        });

        if (response.experiment_id) {
          setExperimentId(response.experiment_id);
          notifications.toasts.addSuccess(
            `Experiment ${response.experiment_id} created successfully`
          );
          history.push(`/experiment/`);
        } else {
          throw new Error('No experiment ID received');
        }
      } catch (err) {
        notifications.toasts.addError(err, {
          title: 'Failed to create experiment',
        });
      } finally {
        setIsCreating(false);
      }
    } else {
      console.log('Validation failed: Please fill in all required fields');
    }
  };

  const handleBackToConfig = () => {
    setShowEvaluation(false);
  };

  const renderConfiguration = () => (
    <EuiFlexGroup direction="column" gutterSize="m">
      <EuiFlexItem grow={false}>
        <EuiTitle size="m">
          <h2>{templateType} Experiment</h2>
        </EuiTitle>
        <EuiSpacer size="m" />
        <ConfigurationForm templateType={templateType} onSave={handleConfigSave} />
      </EuiFlexItem>

      <EuiFlexItem>
        <SearchConfigForm
          formData={searchConfigData}
          onChange={handleSearchConfigChange}
          http={http}
        />
      </EuiFlexItem>

      <EuiFlexItem>
        <ConfigurationActions onBack={onBack} onClose={onClose} onNext={handleNext} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <>
      {isCreating ? (
        <EuiLoadingSpinner size="xl" />
      ) : (
        renderConfiguration()
      )}
    </>
  );
};

export const TemplateConfigurationWithRouter = withRouter(TemplateConfiguration);
