import { ParameterService } from '../ParameterService';
import { ParameterManager } from '../ParameterManager';
import { ParameterPresetsManager } from '../ParameterPresets';
import { AdvancedParameterValidator } from '../ParameterValidationRules';
import { ParameterDefinition } from '../../../types';

describe('ParameterService', () => {
  let service: ParameterService;
  let mockParameterManager: jest.Mocked<ParameterManager>;
  let mockPresetsManager: jest.Mocked<ParameterPresetsManager>;
  let mockAdvancedValidator: jest.Mocked<AdvancedParameterValidator>;

  const mockDefinitions: ParameterDefinition[] = [
    {
      key: 'temperature',
      type: 'number',
      defaultValue: 0.7,
      min: 0,
      max: 2,
      description: 'Controls randomness',
    },
    {
      key: 'model',
      type: 'select',
      defaultValue: 'gpt-3.5-turbo',
      options: ['gpt-3.5-turbo', 'gpt-4'],
      description: 'Model selection',
    },
    {
      key: 'maxTokens',
      type: 'number',
      defaultValue: 1000,
      min: 1,
      max: 4000,
      description: 'Maximum tokens',
    },
  ];

  beforeEach(() => {
    mockParameterManager = {
      registerProvider: jest.fn(),
      getProviderDefinitions: jest.fn().mockReturnValue(mockDefinitions),
      getAllProviders: jest.fn().mockReturnValue(['openai', 'gemini']),
      validateProviderParameters: jest.fn(),
      mergeWithProviderDefaults: jest.fn(),
      cleanProviderParameters: jest.fn(),
      convertProviderParameters: jest.fn(),
      getParameterDetails: jest.fn(),
      supportsParameter: jest.fn(),
      getParameterSuggestions: jest.fn(),
      getProviderParameterSummary: jest.fn(),
    } as any;

    mockPresetsManager = {
      getProviderPresets: jest.fn().mockReturnValue([]),
      getPresetById: jest.fn(),
      createCustomPreset: jest.fn(),
      addPreset: jest.fn(),
      updatePreset: jest.fn(),
      removePreset: jest.fn(),
      getDefaultPreset: jest.fn(),
      getPresetsByTag: jest.fn(),
      getPresetsStats: jest.fn(),
    } as any;

    mockAdvancedValidator = {
      validateAdvanced: jest.fn().mockReturnValue({
        valid: true,
        errors: [],
        dependencyErrors: [],
        exclusionErrors: [],
        customRuleErrors: [],
      }),
      addCustomRule: jest.fn(),
      addDependency: jest.fn(),
      addMutualExclusion: jest.fn(),
      validateDependencies: jest.fn(),
      validateMutualExclusions: jest.fn(),
      validateCustomRules: jest.fn(),
    } as any;

    service = new ParameterService(
      mockParameterManager,
      mockPresetsManager,
      mockAdvancedValidator
    );
  });

  describe('registerProvider', () => {
    it('should register provider with parameter definitions', () => {
      service.registerProvider('test-provider', mockDefinitions);

      expect(mockParameterManager.registerProvider).toHaveBeenCalledWith(
        'test-provider',
        mockDefinitions
      );
    });
  });

  describe('getProviderDefinitions', () => {
    it('should return provider parameter definitions', () => {
      const result = service.getProviderDefinitions('openai');

      expect(result).toEqual(mockDefinitions);
      expect(mockParameterManager.getProviderDefinitions).toHaveBeenCalledWith(
        'openai'
      );
    });
  });

  describe('getAllProviders', () => {
    it('should return all registered providers', () => {
      const result = service.getAllProviders();

      expect(result).toEqual(['openai', 'gemini']);
      expect(mockParameterManager.getAllProviders).toHaveBeenCalled();
    });
  });

  describe('validateParameters', () => {
    it('should perform basic validation', () => {
      const parameters = { temperature: 0.8, model: 'gpt-4' };

      const result = service.validateParameters('openai', parameters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should perform advanced validation when requested', () => {
      const parameters = { temperature: 0.8, model: 'gpt-4' };
      const options = { validateDependencies: true, validateCustomRules: true };

      service.validateParameters('openai', parameters, options);

      expect(mockAdvancedValidator.validateAdvanced).toHaveBeenCalledWith(
        'openai',
        parameters,
        mockDefinitions
      );
    });

    it('should include suggestions when requested', () => {
      const parameters = { temperature: 0.8 };
      const options = { includeWarnings: true };

      const result = service.validateParameters('openai', parameters, options);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should validate invalid temperature', () => {
      const parameters = { temperature: 3.0 }; // Above max

      const result = service.validateParameters('openai', parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'temperature',
          code: 'OUT_OF_RANGE',
        })
      );
    });

    it('should validate invalid model selection', () => {
      const parameters = { model: 'invalid-model' };

      const result = service.validateParameters('openai', parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'model',
          code: 'INVALID_OPTION',
        })
      );
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge parameters with defaults', () => {
      const parameters = { temperature: 0.8 };
      const expected = {
        temperature: 0.8,
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
      };

      mockParameterManager.mergeWithProviderDefaults.mockReturnValue(expected);

      const result = service.mergeWithDefaults('openai', parameters);

      expect(result).toEqual(expected);
      expect(
        mockParameterManager.mergeWithProviderDefaults
      ).toHaveBeenCalledWith('openai', parameters);
    });
  });

  describe('cleanParameters', () => {
    it('should remove unknown parameters', () => {
      const parameters = { temperature: 0.8, unknownParam: 'value' };
      const expected = { temperature: 0.8 };

      mockParameterManager.cleanProviderParameters.mockReturnValue(expected);

      const result = service.cleanParameters('openai', parameters);

      expect(result).toEqual(expected);
      expect(mockParameterManager.cleanProviderParameters).toHaveBeenCalledWith(
        'openai',
        parameters
      );
    });
  });

  describe('convertParameters', () => {
    it('should convert parameter types', () => {
      const parameters = { temperature: '0.8', maxTokens: '1000' };
      const expected = { temperature: 0.8, maxTokens: 1000 };

      mockParameterManager.convertProviderParameters.mockReturnValue(expected);

      const result = service.convertParameters('openai', parameters);

      expect(result).toEqual(expected);
      expect(
        mockParameterManager.convertProviderParameters
      ).toHaveBeenCalledWith('openai', parameters);
    });
  });

  describe('getParameterDetails', () => {
    it('should return parameter definition details', () => {
      const expected = mockDefinitions[0];
      mockParameterManager.getParameterDetails.mockReturnValue(expected);

      const result = service.getParameterDetails('openai', 'temperature');

      expect(result).toEqual(expected);
      expect(mockParameterManager.getParameterDetails).toHaveBeenCalledWith(
        'openai',
        'temperature'
      );
    });

    it('should return null for unknown parameter', () => {
      mockParameterManager.getParameterDetails.mockReturnValue(null);

      const result = service.getParameterDetails('openai', 'unknown');

      expect(result).toBeNull();
    });
  });

  describe('supportsParameter', () => {
    it('should return true for supported parameter', () => {
      mockParameterManager.supportsParameter.mockReturnValue(true);

      const result = service.supportsParameter('openai', 'temperature');

      expect(result).toBe(true);
      expect(mockParameterManager.supportsParameter).toHaveBeenCalledWith(
        'openai',
        'temperature'
      );
    });

    it('should return false for unsupported parameter', () => {
      mockParameterManager.supportsParameter.mockReturnValue(false);

      const result = service.supportsParameter('openai', 'unknown');

      expect(result).toBe(false);
    });
  });

  describe('getParameterSuggestions', () => {
    it('should return parameter suggestions', () => {
      const expected = [0.7, 0, 2];
      mockParameterManager.getParameterSuggestions.mockReturnValue(expected);

      const result = service.getParameterSuggestions('openai', 'temperature');

      expect(result).toEqual(expected);
      expect(mockParameterManager.getParameterSuggestions).toHaveBeenCalledWith(
        'openai',
        'temperature'
      );
    });
  });

  describe('generateParameterSuggestions', () => {
    it('should generate optimization suggestions', () => {
      const parameters = { temperature: 0.1 }; // Very low temperature

      const result = service.generateParameterSuggestions('openai', parameters);

      expect(result).toContain(
        'Low temperature may produce repetitive responses'
      );
    });

    it('should suggest setting default values for missing parameters', () => {
      const parameters = {}; // No parameters set

      const result = service.generateParameterSuggestions('openai', parameters);

      expect(result.some(s => s.includes('Consider setting'))).toBe(true);
    });

    it('should warn about high token limits', () => {
      const parameters = { maxTokens: 3000 };

      const result = service.generateParameterSuggestions('openai', parameters);

      expect(result).toContain(
        'High token limit may result in expensive API calls'
      );
    });
  });

  describe('processParameters', () => {
    it('should process parameters through complete pipeline', () => {
      const inputParameters = { temperature: '0.8', unknownParam: 'value' };
      const convertedParams = { temperature: 0.8, unknownParam: 'value' };
      const cleanedParams = { temperature: 0.8 };
      const mergedParams = {
        temperature: 0.8,
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
      };

      mockParameterManager.convertProviderParameters.mockReturnValue(
        convertedParams
      );
      mockParameterManager.cleanProviderParameters.mockReturnValue(
        cleanedParams
      );
      mockParameterManager.mergeWithProviderDefaults.mockReturnValue(
        mergedParams
      );

      const result = service.processParameters('openai', inputParameters);

      expect(result.valid).toBe(true);
      expect(result.parameters).toEqual(mergedParams);
      expect(result.validation.isValid).toBe(true);

      // Verify pipeline order
      expect(
        mockParameterManager.convertProviderParameters
      ).toHaveBeenCalledWith('openai', inputParameters);
      expect(mockParameterManager.cleanProviderParameters).toHaveBeenCalledWith(
        'openai',
        convertedParams
      );
      expect(
        mockParameterManager.mergeWithProviderDefaults
      ).toHaveBeenCalledWith('openai', cleanedParams);
    });
  });

  describe('compareParameters', () => {
    it('should compare two parameter sets', () => {
      const params1 = { temperature: 0.7, model: 'gpt-3.5-turbo' };
      const params2 = { temperature: 0.8, maxTokens: 1000 };

      const result = service.compareParameters(params1, params2);

      expect(result).toContainEqual({
        key: 'temperature',
        type: 'changed',
        oldValue: 0.7,
        newValue: 0.8,
      });
      expect(result).toContainEqual({
        key: 'model',
        type: 'removed',
        oldValue: 'gpt-3.5-turbo',
      });
      expect(result).toContainEqual({
        key: 'maxTokens',
        type: 'added',
        newValue: 1000,
      });
    });
  });

  describe('getParameterStats', () => {
    it('should return parameter statistics', () => {
      mockParameterManager.getProviderParameterSummary.mockReturnValue({
        total: 3,
        byType: { number: 2, select: 1 },
        required: 0,
        optional: 3,
      });

      const result = service.getParameterStats();

      expect(result.totalProviders).toBe(2);
      expect(result.totalParameters).toBe(6); // 3 params × 2 providers
      expect(result.parametersByProvider).toEqual({
        openai: 3,
        gemini: 3,
      });
    });
  });
});
