import { FeatureCollection, LineString } from 'geojson';

export type Scenario = {
  gps: FeatureCollection<LineString>;
  id: string;
  roads: FeatureCollection<LineString>;
};

export const gpsWalkData: FeatureCollection<LineString> = {
  features: [
    {
      geometry: {
        coordinates: [
          [-3.646_077_394_005_715, 50.794_510_981_765_6],
          [-3.645_902_241_256_692_4, 50.794_502_354_647_39],
          [-3.645_861_296_459_003, 50.794_469_284_013_39],
          [-3.645_818_076_949_467_5, 50.794_362_882_683_004],
          [-3.645_736_187_352_184_7, 50.794_374_385_541_6]
        ],
        type: 'LineString'
      },
      properties: {
        type: 'route'
      },
      type: 'Feature'
    }
  ],
  type: 'FeatureCollection'
};

export const scenarioOneData: FeatureCollection<LineString> = {
  features: [
    {
      bbox: [-3.646_106_7, 50.794_328, -3.645_706_7, 50.794_575_7],
      geometry: {
        coordinates: [
          [-3.646_106_7, 50.794_575_7],
          [-3.645_706_7, 50.794_328]
        ],
        type: 'LineString'
      },
      id: '71',
      properties: {
        hash: 'gcj2vnbgz.gcj2vnc62',
        highway: 'footway',
        length: 39.358_070_231_087_16,
        name: null,
        oneway: false,
        osmid: 176_300_525,
        reversed: false,
        selected: false,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    }
  ],
  type: 'FeatureCollection'
};

export const gpsWalkAlongSingleLineStringWithVariations: FeatureCollection<LineString> =
  {
    features: [
      {
        geometry: {
          coordinates: [
            [-3.647_047_916_134_624_8, 50.794_765_188_022_61],
            [-3.646_859_570_581_682_4, 50.794_787_767_080_55],
            [-3.646_624_679_861_872_7, 50.794_782_293_370_53],
            [-3.646_541_331_543_005_5, 50.794_762_451_166_35]
          ],
          type: 'LineString'
        },
        properties: {
          type: 'route'
        },
        type: 'Feature'
      }
    ],
    type: 'FeatureCollection'
  };

export const singleLineStringWithVariations: FeatureCollection<LineString> = {
  features: [
    {
      bbox: [-3.647_211_5, 50.794_694, -3.646_380_4, 50.794_801_7],
      geometry: {
        coordinates: [
          [-3.646_380_4, 50.794_694],
          [-3.646_498_8, 50.794_764_5],
          [-3.646_581_2, 50.794_799_2],
          [-3.646_678_9, 50.794_801_7],
          [-3.646_808_9, 50.794_787_4],
          [-3.646_937_6, 50.794_772_8],
          [-3.647_211_5, 50.794_788]
        ],
        type: 'LineString'
      },
      id: '35',
      properties: {
        hash: 'gcj2vnbu9.gcj2vnbjj',
        highway: 'residential',
        length: 63.055_002_948_254_75,
        name: 'Beech Park',
        oneway: false,
        osmid: 29_406_930,
        reversed: false,
        selected: false,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    }
  ],
  type: 'FeatureCollection'
};

const gpsWalkAlongTwoLineStrings: FeatureCollection<LineString> = {
  features: [
    {
      geometry: {
        coordinates: [
          [-3.647_923_598_279_59, 50.794_874_299_570_89],
          [-3.647_868_238_595_72, 50.794_821_245_970_525],
          [-3.647_818_236_300_509, 50.794_800_927_554_49],
          [-3.647_530_723_101_624_5, 50.794_811_086_763_84]
        ],
        type: 'LineString'
      },
      properties: {
        type: 'route'
      },
      type: 'Feature'
    }
  ],
  type: 'FeatureCollection'
};

export const twoLineStrings: FeatureCollection<LineString> = {
  features: [
    {
      bbox: [-3.647_872_4, 50.794_749_3, -3.647_211_5, 50.794_798_7],
      geometry: {
        coordinates: [
          [-3.647_211_5, 50.794_788],
          [-3.647_515_1, 50.794_798_7],
          [-3.647_685_5, 50.794_787_4],
          [-3.647_872_4, 50.794_749_3]
        ],
        type: 'LineString'
      },
      id: '42',
      properties: {
        hash: 'gcj2vnbjj.gcj2uyzsy',
        highway: 'residential',
        length: 47.217_396_755_816_274,
        name: 'Beech Park',
        oneway: false,
        osmid: 29_406_930,
        reversed: false,
        selected: true,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    },
    {
      bbox: [-3.648_025, 50.794_749_3, -3.647_872_4, 50.794_913],
      geometry: {
        coordinates: [
          [-3.648_025, 50.794_913],
          [-3.647_933_4, 50.794_851_7],
          [-3.647_872_4, 50.794_749_3]
        ],
        type: 'LineString'
      },
      id: '88',
      properties: {
        hash: 'gcj2uyztf.gcj2uyzsy',
        highway: 'residential',
        length: 21.542_981_725_282_807,
        name: 'Beech Park',
        oneway: false,
        osmid: 176_758_347,
        reversed: false,
        selected: true,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    }
  ],
  type: 'FeatureCollection'
};

export const data: FeatureCollection = {
  features: [
    {
      bbox: [-3.646_106_7, 50.794_575_7, -3.645_764_5, 50.794_762_4],
      geometry: {
        coordinates: [
          [-3.646_106_7, 50.794_575_7],
          [-3.645_804_5, 50.794_762_4],
          [-3.645_764_5, 50.794_737_2]
        ],
        type: 'LineString'
      },
      id: '73',
      properties: {
        hash: 'gcj2vnbgz.gcj2vnchz',
        highway: 'footway',
        length: 33.670_341_119_838_454,
        name: null,
        oneway: false,
        osmid: 176_300_538,
        reversed: true,
        selected: false,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    },
    {
      bbox: [-3.645_764_5, 50.794_520_8, -3.645_408_4, 50.794_737_2],
      geometry: {
        coordinates: [
          [-3.645_408_4, 50.794_520_8],
          [-3.645_764_5, 50.794_737_2]
        ],
        type: 'LineString'
      },
      id: '76',
      properties: {
        hash: 'gcj2vnc7x.gcj2vnchz',
        highway: 'footway',
        length: 34.719_789_202_371_615,
        name: null,
        oneway: false,
        osmid: 176_300_538,
        reversed: false,
        selected: false,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    },
    {
      bbox: [-3.645_706_7, 50.794_328, -3.645_408_4, 50.794_520_8],
      geometry: {
        coordinates: [
          [-3.645_706_7, 50.794_328],
          [-3.645_408_4, 50.794_520_8]
        ],
        type: 'LineString'
      },
      id: '69',
      properties: {
        hash: 'gcj2vnc62.gcj2vnc7x',
        highway: 'footway',
        length: 29.986_722_754_456_99,
        name: null,
        oneway: false,
        osmid: 176_300_531,
        reversed: false,
        selected: false,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    },
    {
      bbox: [-3.646_106_7, 50.794_328, -3.645_706_7, 50.794_575_7],
      geometry: {
        coordinates: [
          [-3.645_706_7, 50.794_328],
          [-3.646_106_7, 50.794_575_7]
        ],
        type: 'LineString'
      },
      id: '68',
      properties: {
        hash: 'gcj2vnc62.gcj2vnbgz',
        highway: 'footway',
        length: 39.358_070_231_087_16,
        name: null,
        oneway: false,
        osmid: 176_300_525,
        reversed: true,
        selected: true,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    },
    {
      bbox: [-3.646_106_7, 50.794_328, -3.645_706_7, 50.794_575_7],
      geometry: {
        coordinates: [
          [-3.646_106_7, 50.794_575_7],
          [-3.645_706_7, 50.794_328]
        ],
        type: 'LineString'
      },
      id: '71',
      properties: {
        hash: 'gcj2vnbgz.gcj2vnc62',
        highway: 'footway',
        length: 39.358_070_231_087_16,
        name: null,
        oneway: false,
        osmid: 176_300_525,
        reversed: false,
        selected: true,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    },
    {
      bbox: [-3.645_706_7, 50.794_328, -3.645_408_4, 50.794_520_8],
      geometry: {
        coordinates: [
          [-3.645_408_4, 50.794_520_8],
          [-3.645_706_7, 50.794_328]
        ],
        type: 'LineString'
      },
      id: '75',
      properties: {
        hash: 'gcj2vnc7x.gcj2vnc62',
        highway: 'footway',
        length: 29.986_722_754_456_99,
        name: null,
        oneway: false,
        osmid: 176_300_531,
        reversed: true,
        selected: false,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    },
    {
      bbox: [-3.645_764_5, 50.794_520_8, -3.645_408_4, 50.794_737_2],
      geometry: {
        coordinates: [
          [-3.645_764_5, 50.794_737_2],
          [-3.645_408_4, 50.794_520_8]
        ],
        type: 'LineString'
      },
      id: '83',
      properties: {
        hash: 'gcj2vnchz.gcj2vnc7x',
        highway: 'footway',
        length: 34.719_789_202_371_615,
        name: null,
        oneway: false,
        osmid: 176_300_538,
        reversed: true,
        selected: false,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    },
    {
      bbox: [-3.646_106_7, 50.794_575_7, -3.645_764_5, 50.794_762_4],
      geometry: {
        coordinates: [
          [-3.645_764_5, 50.794_737_2],
          [-3.645_804_5, 50.794_762_4],
          [-3.646_106_7, 50.794_575_7]
        ],
        type: 'LineString'
      },
      id: '84',
      properties: {
        hash: 'gcj2vnchz.gcj2vnbgz',
        highway: 'footway',
        length: 33.670_341_119_838_454,
        name: null,
        oneway: false,
        osmid: 176_300_538,
        reversed: false,
        selected: false,
        service: null,
        street_count: null,
        type: 'edge',
        x: null,
        y: null
      },
      type: 'Feature'
    }
  ],
  type: 'FeatureCollection'
};

export const scenarios: Scenario[] = [
  {
    gps: gpsWalkData,
    id: 'scenario-one',
    roads: scenarioOneData
  },
  {
    gps: gpsWalkAlongSingleLineStringWithVariations,
    id: 'scenario-two',
    roads: singleLineStringWithVariations
  },
  {
    gps: gpsWalkAlongTwoLineStrings,
    id: 'scenario-three',
    roads: twoLineStrings
  }
];
