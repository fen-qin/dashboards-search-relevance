/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiFieldText,
  EuiComboBox,
  EuiFieldNumber,
} from '@elastic/eui';
import { QuerySetOption, UserBehaviorFormData } from '../types';
import { CoreStart } from '../../../../../src/core/public';
import { ServiceEndpoints } from '../../../../../common';

interface UserBehaviorFormProps {
  formData: UserBehaviorFormData;
  onChange: (field: keyof UserBehaviorFormData, value: any) => void;
  http: CoreStart['http'];
}

export const UserBehaviorForm = ({ formData, onChange, http }: UserBehaviorFormProps) => {
  const [querySetOptions, setQuerySetOptions] = useState<QuerySetOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [k, setK] = useState<number>(10);

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
    <EuiFlexGroup gutterSize="m" direction="row" style={{ maxWidth: 600 }}>
      <EuiFlexItem grow={4}>
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
      <EuiFlexItem grow={1}>
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
      <EuiFlexItem grow={3}>
        <EuiFormRow label="Judgment ID">
          <EuiFieldText
            placeholder="Enter UBI judgment ID"
            value={formData.judgmentId}
            onChange={(e) => onChange('judgmentId', e.target.value)}
            fullWidth
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
