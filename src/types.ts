export type BuildType = 'esm' | 'cjs';

export interface BundleValue {
  code?: string;
  fileName: string;
}

export type BuildStep = {
  type: BuildType;
  production: boolean;
};

export interface InputOptions {
  cache?: any;
  plugins: any[];
  input: string;
  external: any;
  treeshake: {
    propertyReadSideEffects: boolean;
  };
}

export interface OutputOptions {
  type: BuildType;
  production: boolean;
}
