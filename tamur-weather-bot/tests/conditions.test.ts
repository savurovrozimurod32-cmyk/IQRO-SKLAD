import { describe, expect, it } from 'vitest';
import {
  fromMetSymbol,
  fromOpenMeteoCode,
  fromWeatherApiCode,
  severity,
  uzLabel,
} from '../src/weather/conditions.js';

describe('Open-Meteo WMO kodlari', () => {
  it('asosiy holatlar', () => {
    expect(fromOpenMeteoCode(0)).toBe('clear');
    expect(fromOpenMeteoCode(2)).toBe('partly_cloudy');
    expect(fromOpenMeteoCode(3)).toBe('cloudy');
    expect(fromOpenMeteoCode(45)).toBe('fog');
    expect(fromOpenMeteoCode(51)).toBe('drizzle');
    expect(fromOpenMeteoCode(61)).toBe('rain');
    expect(fromOpenMeteoCode(65)).toBe('heavy_rain');
    expect(fromOpenMeteoCode(75)).toBe('snow');
    expect(fromOpenMeteoCode(95)).toBe('thunderstorm');
    expect(fromOpenMeteoCode(null)).toBe('unknown');
    expect(fromOpenMeteoCode(9999)).toBe('unknown');
  });
});

describe('MET Norway symbol_code', () => {
  it('suffiksdan mustaqil kalit so‘z bo‘yicha', () => {
    expect(fromMetSymbol('clearsky_day')).toBe('clear');
    expect(fromMetSymbol('fair_night')).toBe('partly_cloudy');
    expect(fromMetSymbol('partlycloudy_day')).toBe('partly_cloudy');
    expect(fromMetSymbol('cloudy')).toBe('cloudy');
    expect(fromMetSymbol('fog')).toBe('fog');
    expect(fromMetSymbol('lightrain')).toBe('drizzle');
    expect(fromMetSymbol('rain')).toBe('rain');
    expect(fromMetSymbol('heavyrain')).toBe('heavy_rain');
    expect(fromMetSymbol('lightsnow')).toBe('snow');
    expect(fromMetSymbol('sleet')).toBe('snow');
    expect(fromMetSymbol('rainandthunder')).toBe('thunderstorm');
    expect(fromMetSymbol(undefined)).toBe('unknown');
  });
});

describe('WeatherAPI kodlari', () => {
  it('asosiy holatlar', () => {
    expect(fromWeatherApiCode(1000)).toBe('clear');
    expect(fromWeatherApiCode(1003)).toBe('partly_cloudy');
    expect(fromWeatherApiCode(1006)).toBe('cloudy');
    expect(fromWeatherApiCode(1135)).toBe('fog');
    expect(fromWeatherApiCode(1153)).toBe('drizzle');
    expect(fromWeatherApiCode(1183)).toBe('rain');
    expect(fromWeatherApiCode(1195)).toBe('heavy_rain');
    expect(fromWeatherApiCode(1213)).toBe('snow');
    expect(fromWeatherApiCode(1276)).toBe('thunderstorm');
    expect(fromWeatherApiCode(424242)).toBe('unknown');
  });
});

describe('uzLabel va severity', () => {
  it('o‘zbekcha nomlar', () => {
    expect(uzLabel('clear')).toBe('Quyoshli');
    expect(uzLabel('rain')).toBe('Yomg‘irli');
    expect(uzLabel('unknown')).toBe('Ob-havo o‘zgaruvchan');
  });
  it('jiddiylik tartibi', () => {
    expect(severity('thunderstorm')).toBeGreaterThan(severity('rain'));
    expect(severity('rain')).toBeGreaterThan(severity('clear'));
    expect(severity('clear')).toBeGreaterThan(severity('unknown'));
  });
});
