/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiFieldText,
  EuiComboBox,
  EuiFieldNumber,
} from '@elastic/eui';
import { LLMFormData, QuerySetOption } from '../types';
import { ServiceEndpoints } from '../../../../../common';
import { CoreStart } from '../../../../../src/core/public';

interface LLMFormProps {
  formData: LLMFormData;
  onChange: (field: keyof LLMFormData, value: any) => void;
  http: CoreStart['http'];
}

export const LLMForm = ({ formData, onChange, http }: LLMFormProps) => {
  const [querySetOptions, setQuerySetOptions] = useState<QuerySetOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [k, setK] = useState<number>(formData.k || 10);

  useEffect(() => {
    const fetchQuerySets = async () => {
      try {
        const data = await http.get(ServiceEndpoints.QuerySets);
        const options = data.hits.hits.map((qs: any) => ({
          label: qs._source.name,
          value: qs._source.id,
        }));
        setQuerySetOptions(options);
      } catch (error) {
        console.error('Failed to fetch query sets', error);
        setQuerySetOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuerySets();
  }, [http]);

  const handleQuerySetsChange = (selectedOptions: QuerySetOption[]) => {
    onChange('querySets', selectedOptions || []);
  };

  const handleKChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setK(value);
    onChange('k', value);
  };

  return (
    <EuiFlexGroup gutterSize="m" direction="column" style={{ maxWidth: 600 }}>
      <EuiFlexItem>
        <EuiFormRow label="Query Sets">
          <EuiComboBox
            placeholder={isLoading ? 'Loading...' : 'Select query sets'}
            options={querySetOptions}
            selectedOptions={formData.querySets}
            onChange={handleQuerySetsChange}
            isClearable
            isInvalid={formData.querySets.length === 0}
            isLoading={isLoading}
            async
            fullWidth
            multi
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem>
            <EuiFormRow label="K Value">
              <EuiFieldNumber
                placeholder="Enter k value"
                value={k}
                onChange={handleKChange}
                min={1}
                fullWidth
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Model ID">
              <EuiFieldText
                placeholder="Enter model ID"
                value={formData.modelId}
                onChange={(e) => onChange('modelId', e.target.value)}
                fullWidth
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
