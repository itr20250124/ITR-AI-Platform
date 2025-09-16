// 參數服務模組導出

// 主要服務
export { ParameterService, globalParameterService } from './ParameterService';

// 參數管理器
export {
  ParameterManager,
  ParameterDefaultsManager,
  ParameterRangeChecker,
  ParameterConverter,
  ParameterComparator,
  globalParameterManager,
} from './ParameterManager';

// 預設配置管理
export {
  ParameterPresetsManager,
  ParameterPreset,
  BuiltinPresets,
  globalPresetsManager,
} from './ParameterPresets';

// 高級驗證
export {
  AdvancedParameterValidator,
  CustomValidationRule,
  ParameterDependency,
  ParameterMutualExclusion,
  BuiltinValidationRules,
  BuiltinDependencies,
  globalAdvancedValidator,
} from './ParameterValidationRules';

// 類型定義
export type {
  ValidationOptions,
  CompleteValidationResult,
  ParameterStats,
} from './ParameterService';
