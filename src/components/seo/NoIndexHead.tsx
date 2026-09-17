import React from 'react';
import SeoHead from './SeoHead';

export const NoIndexHead: React.FC = () => {
  return (
    <SeoHead
      title="Brainros Private Workspace"
      description="Private authenticated workspace on Brainros platform."
      robots="noindex, nofollow"
    />
  );
};

export default NoIndexHead;
