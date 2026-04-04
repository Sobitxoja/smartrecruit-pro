import React from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface AppTourProps {
  run: boolean;
  steps: Step[];
  onFinish: () => void;
}

const AppTour: React.FC<AppTourProps> = ({ run, steps, onFinish }) => {
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as any[]).includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb', // blue-600
          zIndex: 10000,
          arrowColor: '#fff',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          textColor: '#334155',
          width: 400,
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '16px',
          padding: '8px'
        },
        buttonNext: {
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '12px',
          padding: '10px 16px',
          textTransform: 'uppercase'
        },
        buttonBack: {
          color: '#64748b',
          marginRight: 10,
          fontWeight: 700,
          fontSize: '12px'
        }
      }}
    />
  );
};

export default AppTour;
