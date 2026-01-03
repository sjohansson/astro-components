import { createPackageConfig } from '../../tsup.package.config';

export default createPackageConfig({
  external: ['react', 'react-dom', '@xyflow/react'],
});
