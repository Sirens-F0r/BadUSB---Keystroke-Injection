import { useCallback, useEffect, useRef } from 'react';
import { Box, BoxProps } from '@mui/material';
import { EChartsReactProps } from 'echarts-for-react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { forwardRef } from 'react';

export interface ReactEchartProps extends BoxProps {
  echarts: EChartsReactProps['echarts'];
  option: EChartsReactProps['option'];
}

const ReactEChart = forwardRef<null | EChartsReactCore, ReactEchartProps>(
  ({ option, ...rest }, ref) => {
    const innerRef = useRef<EChartsReactCore | null>(null);
    const mergedRef = (node: EChartsReactCore | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    useEffect(() => {
      return () => {
        if (innerRef.current) {
          try {
            (innerRef.current as any).dispose();
          } catch {
            // ECharts instance already disposed or never initialized
          }
        }
      };
    }, []);

    const onEvents = useCallback(() => ({}), []);

    return (
      <Box
        component={ReactEChartsCore}
        ref={mergedRef}
        onEvents={onEvents}
        option={{
          ...option,
          tooltip: {
            ...option.tooltip,
            confine: true,
          },
        }}
        {...rest}
      />
    );
  },
);

export default ReactEChart;
