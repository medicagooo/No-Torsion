const {
  cityOptionsByProvinceCode,
  countiesByCityCode
} = require('../../config/areaSelector');
const { translateDetailItems } = require('./textTranslationService');

const localizedAreaNameCache = new Map();

function getCacheKey(language, text) {
  return `${language}::${text}`;
}

function shouldTranslateAreaNames(language) {
  return language === 'en' || language === 'zh-TW';
}

async function localizeOptions(options, language) {
  const normalizedOptions = Array.isArray(options)
    ? options.map((option) => ({
      code: option.code,
      name: String(option.name || '')
    }))
    : [];

  if (!shouldTranslateAreaNames(language) || normalizedOptions.length === 0) {
    return normalizedOptions;
  }

  const pendingTexts = [...new Set(
    normalizedOptions
      .map((option) => option.name.trim())
      .filter(Boolean)
      .filter((text) => !localizedAreaNameCache.has(getCacheKey(language, text)))
  )];

  if (pendingTexts.length > 0) {
    const translations = await translateDetailItems({
      items: pendingTexts.map((text, index) => ({
        fieldKey: String(index),
        text
      })),
      targetLanguage: language
    });

    translations.forEach((entry) => {
      localizedAreaNameCache.set(
        getCacheKey(language, entry.text),
        entry.translatedText || entry.text
      );
    });
  }

  return normalizedOptions.map((option) => ({
    ...option,
    name: localizedAreaNameCache.get(getCacheKey(language, option.name.trim())) || option.name
  }));
}

async function getLocalizedCityOptionsForProvince(provinceCode, language) {
  return localizeOptions(cityOptionsByProvinceCode[provinceCode] || [], language);
}

async function getLocalizedCountyOptionsForCity(cityCode, language) {
  return localizeOptions(countiesByCityCode[cityCode] || [], language);
}

module.exports = {
  getLocalizedCityOptionsForProvince,
  getLocalizedCountyOptionsForCity
};
