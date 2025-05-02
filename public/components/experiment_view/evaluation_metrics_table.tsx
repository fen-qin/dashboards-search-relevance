/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiText,
  EuiSpacer,
  EuiSelect,
  EuiBasicTable,
} from '@elastic/eui';
import React, { useState } from 'react';
import { MetricsSummaryPanel } from './evaluation_metrics_summary';
interface EvaluationMetricsTableProps {
  queryText: string;
  metrics: any;
  judgments: any;
}

export const EvaluationMetricsTable: React.FC<EvaluationMetricsTableProps> = ({
  queryText,
  metrics,
  judgments,
}) => {
  const [selectedConfigIndex, setSelectedConfigIndex] = useState('0');

  const columns = [
    {
      field: 'documentId',
      name: 'Document ID',
      sortable: true,
    },
    {
      field: 'judgmentScore',
      name: 'Judgment Score',
      sortable: true,
      render: (score: number) => score?.toFixed(2) || '-',
    },
  ];

  const getItems = () => {
    const configResults = metrics[selectedConfigIndex] || [];
    return configResults.map((docId: string) => ({
      documentId: docId,
      judgmentScore: judgments[docId] || 0,
    }));
  };

  const evaluationMetrics = metrics.evaluation?.[selectedConfigIndex] || {};

  return (
    <EuiPanel hasBorder paddingSize="m">
      <EuiText>
        <h3>Evaluation Metrics for %SearchText%: {queryText}</h3>
      </EuiText>

      <EuiSpacer size="m" />

      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiSelect
            options={Object.keys(metrics)
              .filter((k) => k !== 'evaluation' && k !== 'judgments')
              .map((idx) => ({
                value: idx,
                text: `Configuration ${idx}`,
              }))}
            value={selectedConfigIndex}
            onChange={(e) => setSelectedConfigIndex(e.target.value)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <MetricsSummaryPanel
        metrics={evaluationMetrics}
        configIndex={selectedConfigIndex}
      />

      <EuiSpacer size="l" />

      <EuiBasicTable items={getItems()} columns={columns} />
    </EuiPanel>
  );
};
