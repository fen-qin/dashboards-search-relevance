/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiStat,
  EuiTitle,
  EuiHorizontalRule,
} from '@elastic/eui';
import React from 'react';

interface MetricsSummaryPanelProps {
  metrics: {
    'precision@5'?: number;
    'precision@10'?: number;
    MAP?: number;
    ndcg?: number;
  };
  configIndex: string;
}

export const MetricsSummaryPanel: React.FC<MetricsSummaryPanelProps> = ({ metrics, configIndex }) => {
  const formatValue = (value: number | undefined) => {
    if (value === undefined) return '-';
    return (value * 100).toFixed(1) + '%';
  };

  return (
    <EuiPanel paddingSize="l">
      <EuiTitle size="s">
        <h3>Metrics Summary for Search Configuration {configIndex}</h3>
      </EuiTitle>
      <EuiHorizontalRule margin="m" />
      <EuiFlexGroup>
        <EuiFlexItem grow={2}>
          <EuiStat
            title={formatValue(metrics['precision@5'])}
            description="Precision@5"
            titleColor={metrics['precision@5'] < 0.9 ? 'danger' : 'secondary'}
            titleSize="l"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <EuiStat
            title={formatValue(metrics['precision@10'])}
            description="Precision@10"
            titleColor={metrics['precision@10'] < 0.9 ? 'danger' : 'success'}
            titleSize="l"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <EuiStat
            title={formatValue(metrics.ndcg)}
            description="NDCG"
            titleColor={metrics.ndcg < 0.9 ? 'danger' : 'success'}
            titleSize="l"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <EuiStat
            title={formatValue(metrics.MAP)}
            description="MAP"
            titleColor={metrics.MAP < 0.9 ? 'danger' : 'success'}
            titleSize="l"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
