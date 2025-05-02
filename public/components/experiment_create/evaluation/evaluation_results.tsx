/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiButtonEmpty,
  EuiHorizontalRule,
  EuiLoadingSpinner,
  EuiText,
  EuiHealth,
  EuiCallOut,
  EuiBasicTable,
} from '@elastic/eui';
import { ServiceEndpoints } from '../../../../common';
import { useOpenSearchDashboards } from '../../../../../../src/plugins/opensearch_dashboards_react/public';

interface EvaluationResultsProps {
  templateType: string;
  experimentId: string;
  onBack: () => void;
}

export const EvaluationResults = ({
  templateType,
  experimentId,
  onBack,
}: EvaluationResultsProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [experimentResults, setExperimentResults] = useState<any>(null);

  const {
    services: { http, notifications },
  } = useOpenSearchDashboards();

  useEffect(() => {
    if (experimentId) {
      fetchExperimentResults();
    }
  }, [experimentId]);

  const fetchExperimentResults = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await http.get(`${ServiceEndpoints.Experiments}/${experimentId}`);
      const experiment = response?.hits?.hits?.[0]?._source;

      if (!experiment) {
        throw new Error('No experiment results found');
      }

      setExperimentResults(experiment);
    } catch (err) {
      setError('Failed to load experiment results');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMetricsTable = (queryText: string, metrics: any) => {
    if (!metrics || (!metrics.pairwiseComparison && !metrics.evaluation)) return null;

    if (metrics.pairwiseComparison) {
      const columns = [
        {
          field: 'metric',
          name: 'Metric',
          sortable: true,
        },
        {
          field: 'value',
          name: 'Value',
          sortable: true,
          render: (value: number) => Number(value).toFixed(2),
        },
      ];
      const items = Object.entries(metrics.pairwiseComparison).map(([metric, value]) => ({
        metric,
        value,
      }));
      return <EuiBasicTable items={items} columns={columns} compressed />;
    } else if (metrics.evaluation) {
      const columns = [
        {
          field: 'metric',
          name: 'Metric',
          width: '200px',
        },
        ...experimentResults.searchConfigurationList.map((configId: string, index: number) => ({
          field: `config_${index}`,
          name: `Configuration ${index + 1}`,
          render: (value: number) => (value !== undefined ? Number(value).toFixed(4) : '-'),
        })),
      ];

      const metricOrder = ['precision@5', 'precision@10', 'ndcg', 'MAP'];
      const items = metricOrder.map((metric) => ({
        metric,
        ...experimentResults.searchConfigurationList.reduce(
          (acc: any, configId: string, index: number) => {
            acc[`config_${index}`] = metrics.evaluation[index]?.[metric];
            return acc;
          },
          {}
        ),
      }));

      return (
        <EuiPanel paddingSize="s">
          <EuiBasicTable items={items} columns={columns} compressed />
        </EuiPanel>
      );
    }
    return null;
  };

  const renderQueryResults = () => {
    if (!experimentResults?.results?.metrics) return null;

    return Object.entries(experimentResults.results.metrics).map(
      ([queryText, metrics]: [string, any]) => {
        const hasError =
          metrics['0']?.[0]?.includes('Error') || metrics['1']?.[0]?.includes('Error');

        return (
          <EuiFlexItem key={queryText}>
            <EuiPanel paddingSize="m">
              <EuiFlexGroup alignItems="center" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiHealth color={hasError ? 'danger' : 'success'}>Query: {queryText}</EuiHealth>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="s" />
              {hasError ? (
                <EuiText color="danger" size="s">
                  {metrics['0'][0]}
                </EuiText>
              ) : (
                renderMetricsTable(queryText, metrics)
              )}
            </EuiPanel>
          </EuiFlexItem>
        );
      }
    );
  };

  if (isLoading) {
    return (
      <EuiFlexGroup justifyContent="center" alignItems="center" style={{ minHeight: '200px' }}>
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="xl" />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (error) {
    return (
      <EuiCallOut title="Error loading results" color="danger" iconType="alealert">
        <p>{error}</p>
        <EuiButtonEmpty onClick={onBack}>Back to configuration</EuiButtonEmpty>
      </EuiCallOut>
    );
  }

  return (
    <div>
      <EuiFlexGroup alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty iconType="arrowLeft" onClick={onBack} size="s">
            Back to configuration
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      <EuiFlexGroup direction="column">
        {experimentResults && (
          <>
            <EuiFlexItem>
              <EuiText>
                <h3>Experiment Details</h3>
              </EuiText>
              <EuiSpacer size="s" />
              <EuiText size="s">
                <p>Query Set ID: {experimentResults.querySetId}</p>
                <p>K: {experimentResults.k}</p>
                <p>Configurations: {experimentResults.searchConfigurationList.join(', ')}</p>
              </EuiText>
            </EuiFlexItem>

            <EuiHorizontalRule />

            <EuiFlexItem>
              <EuiText>
                <h3>Metrics</h3>
              </EuiText>
              <EuiSpacer size="s" />
              {renderQueryResults()}
            </EuiFlexItem>
          </>
        )}
      </EuiFlexGroup>
    </div>
  );
};
