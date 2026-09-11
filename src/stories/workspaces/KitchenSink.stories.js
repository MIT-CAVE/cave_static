import { expect, within } from 'storybook/test'

import App from '../../App'

const initData = {
  settings: {
    demo: {
      map1: {
        scrollSpeed: 0.1,
      },
      dash1: {
        displayTime: 30,
      },
    },
    sync: {
      panes: {
        name: 'Open Pane',
        showToggle: true,
        value: true,
        data: {
          ab1: ['panes', 'paneState', 'left'],
          ab2: ['panes', 'paneState', 'right'],
        },
      },
      pageSelection: {
        name: 'Page Selection',
        showToggle: true,
        value: false,
        data: { ps1: ['pages', 'currentPage'] },
      },
      mapLayers: {
        name: 'Map Layers',
        showToggle: true,
        value: true,
        data: { ml1: ['maps', 'data', 'map1', 'legendGroups'] },
      },
      chartColors: {
        name: 'Chart Colors',
        showToggle: true,
        value: true,
        data: {
          go1: ['groupedOutputs', 'groupings'],
        },
      },
      modals: {
        name: 'Open Modal',
        showToggle: true,
        value: true,
        data: { pn1: ['panes', 'paneState', 'center'] },
      },
      draggables: {
        name: 'Draggables',
        showToggle: true,
        value: true,
        data: {
          dr1: ['draggables', 'data'],
        },
      },
      pages: {
        name: 'Dashboards',
        showToggle: true,
        value: true,
        data: { db1: ['pages', 'data'] },
      },
    },
    iconUrl: 'https://react-icons.mitcave.com/5.4.0',
    order: {
      sync: ['panes', 'modals', 'pageSelection', 'mapLayers', 'pages'],
    },
    time: {
      timeLength: 3,
      timeUnits: 'Century',
      looping: false,
      speed: 1,
    },
    defaults: {
      precision: 4,
      trailingZeros: true,
      unitPlacement: 'afterWithSpace',
    },
  },
  draggables: {
    data: {
      session: {
        open: true,
        position: {
          x: 8,
          y: 8,
        },
      },
      globalOutputs: {
        open: true,
        position: {
          x: 8,
          y: 68,
        },
      },
      mapNames: {
        open: true,
        hideCloseOption: true,
        hideDragOption: true,
        position: {
          x: 8,
          y: 8,
        },
      },
      time: {
        showDragHandle: true,
      },
    },
  },
  appBar: {
    order: {
      data: [
        'buttonSolve',
        'examplePropsPane',
        'buttonExport',
        'dash1',
        'dash2',
        'dash3',
      ],
    },
    data: {
      buttonSolve: {
        icon: 'bs/BsLightningFill',
        color: 'rgb(178 179 55)',
        apiCommand: 'solve',
        type: 'button',
        bar: 'upperLeft',
      },
      examplePropsPane: {
        icon: 'fa/FaCogs',
        type: 'pane',
        bar: 'upperLeft',
        variant: 'wall',
      },
      buttonExport: {
        icon: 'md/MdFileDownload',
        apiCommand: 'exportData',
        type: 'button',
        bar: 'upperLeft',
      },
      dash1: {
        type: 'page',
        icon: 'md/MdInsertChart',
        bar: 'lowerLeft',
      },
      dash2: {
        type: 'page',
        icon: 'md/MdInsertChartOutlined',
        bar: 'lowerLeft',
      },
      dash3: {
        type: 'page',
        icon: 'fa/FaChartArea',
        bar: 'lowerLeft',
      },
      exampleModal: {
        icon: 'md/MdInfo',
        color: 'rgb(195 164 222)',
        type: 'pane',
        bar: 'upperRight',
        variant: 'modal',
      },
    },
  },
  panes: {
    paneState: { left: {}, right: {}, center: {} },
    data: {
      exampleModal: {
        name: 'Example Modal',
        props: {
          buttonViewInfo: {
            name: 'Info Button',
            type: 'button',
            apiCommand: 'viewInfo',
            help: 'Press this button to view info',
          },
        },
        values: {
          buttonViewInfo: 'Press',
        },
        layout: {
          type: 'grid',
          numColumns: 1,
          numRows: 1,
          data: {
            col1Row1: {
              type: 'item',
              column: 1,
              row: 1,
              itemId: 'buttonViewInfo',
            },
          },
        },
      },
      examplePropsPane: {
        name: 'Example Props Pane',
        props: {
          numericHeader: {
            name: 'Numeric Props',
            type: 'head',
            help: 'Some help for numeric props',
          },
          numericInputExample: {
            name: 'Numeric Input Example',
            type: 'num',
            help: 'Help for the numeric input example',
            maxValue: 100,
            minValue: 0,
            notation: 'scientific',
            notationDisplay: 'x10^+',
            precision: 0,
            unit: 'units',
          },
          numericSliderExample: {
            name: 'Numeric Slider Example',
            type: 'num',
            variant: 'slider',
            help: 'Help for the numeric slider example',
            maxValue: 100,
            minValue: 0,
            unit: '%',
          },
          incrementalSliderExample: {
            name: 'Incremental Slider Example',
            type: 'num',
            variant: 'incslider',
            help: 'Help for the incremental slider example',
            valueOptions: [0, 25, 50, 75, 100],
            unit: '%',
          },
          textHeader: {
            name: 'Text Props',
            type: 'head',
            help: 'Some help for Text Props',
          },
          textInputExample: {
            name: 'Text Input Example',
            type: 'text',
            help: 'Help for the text input example',
          },
          textAreaInputExample: {
            name: 'TextArea Input Example',
            type: 'text',
            variant: 'textarea',
            rows: 6,
            help: 'Help for the text area input example',
          },
          toggleHeader: {
            name: 'Toggle Props',
            type: 'head',
            help: 'Some help for toggle props',
          },
          toggleSwitchExample: {
            name: 'Toggle Switch Example',
            type: 'toggle',
            variant: 'switch',
            label: 'The switch is off',
            activeLabel: 'The switch is on',
            help: 'Help for the toggle switch example',
          },
          toggleButtonExample: {
            name: 'Toggle Button Example',
            type: 'toggle',
            variant: 'button',
            label: 'Inactive',
            icon: 'md/MdCheck',
            color: '#9e9e9e',
            size: '32px',
            activeColor: '#66bb6a',
            activeLabel: 'Active',
            help: 'Help for the toggle button example',
          },
          toggleCheckboxExample: {
            name: 'Toggle Checkbox Example',
            type: 'toggle',
            variant: 'checkbox',
            label: 'Activate',
            help: 'Help for the toggle checkbox example',
          },
          buttonHeader: {
            name: 'Button Props',
            type: 'head',
            help: 'Some help for numeric props',
          },
          filledButtonExample: {
            name: 'Filled Button Example',
            type: 'button',
            apiCommand: 'testSuccess',
            help: 'Press this button to trigger an action',
          },
          outlinedButtonExample: {
            name: 'Outlined Button Example',
            type: 'button',
            variant: 'outlined',
            color: '#ed3e3e',
            fullWidth: true,
            startIcon: 'vsc/VscError',
            endIcon: 'md/MdSend',
            apiCommand: 'test',
            help: 'Press this button to throw an error',
          },
          textButtonExample: {
            name: 'Text Button Example',
            type: 'button',
            variant: 'text',
            color: '#ff0',
            startIcon: 'fa/FaExclamationTriangle',
            apiCommand: 'testWarning',
            help: 'Press this button to trigger a warning',
          },
          iconButtonExample: {
            name: 'Icon Button Example',
            type: 'button',
            size: '32px',
            variant: 'icon',
            icon: 'fa/FaGithub',
            placement: 'center',
            url: 'https://github.com/MIT-CAVE',
            help: 'Help for the icon button example',
          },
          mediaHeader: {
            name: 'Media Props',
            type: 'head',
            help: 'Some help for media props',
          },
          pictureExample: {
            name: 'Picture Example',
            type: 'media',
            variant: 'picture',
            help: 'Click or tap the image to view an enlarged version',
          },
          videoExample: {
            name: 'Video Example',
            type: 'media',
            variant: 'video',
            help: 'Click or tap the play button to start the video',
          },
          selectorHeader: {
            name: 'Selection Props',
            type: 'head',
            help: 'Some help for Selection Props',
          },
          dropdownItemExample: {
            name: 'Dropdown Item Example',
            type: 'selector',
            variant: 'dropdown',
            options: {
              option_a: { name: 'Option A' },
              option_b: { name: 'Option B' },
              option_c: { name: 'Option C' },
            },
            help: 'Select an option from the dropdown',
          },
          checkboxItemExample: {
            name: 'Checkbox Item Example',
            type: 'selector',
            variant: 'checkbox',
            options: {
              option_a: { name: 'Option A' },
              option_b: { name: 'Option B' },
              option_c: { name: 'Option C' },
            },
            help: 'Select all relevant items',
          },
          hcheckboxItemExample: {
            name: 'Horizontal Checkbox Item Example',
            type: 'selector',
            variant: 'hcheckbox',
            options: {
              option_a: { name: 'Option A' },
              option_b: { name: 'Option B' },
              option_c: { name: 'Option C' },
            },
            help: 'Select all relevant items',
          },
          radioItemExample: {
            name: 'Radio Item Example',
            type: 'selector',
            variant: 'radio',
            options: {
              option_a: { name: 'Option A' },
              option_b: { name: 'Option B' },
              option_c: { name: 'Option C' },
            },
            help: 'Select one item from the list',
          },
          hstepperItemExample: {
            name: 'Horizontal Stepper Item Example',
            type: 'selector',
            variant: 'hstepper',
            options: {
              option_a: { name: 'Option A' },
              option_b: { name: 'Option B' },
              option_c: { name: 'Option C' },
            },
            help: 'Select an option from the stepper',
          },
          vstepperItemExample: {
            name: 'Vertical Stepper Item Example',
            type: 'selector',
            variant: 'vstepper',
            options: {
              option_a: { name: 'Option A' },
              option_b: { name: 'Option B' },
              option_c: { name: 'Option C' },
            },
            help: 'Select an option from the stepper',
          },
          hradioItemExample: {
            name: 'Horizontal Radio Item Example',
            type: 'selector',
            variant: 'hradio',
            options: {
              option_a: { name: 'Option A' },
              option_b: { name: 'Option B' },
              option_c: { name: 'Option C' },
            },
            help: 'Select an option from the radio',
          },
          comboBoxItemExample: {
            name: 'ComboBox Item Example',
            type: 'selector',
            variant: 'combobox',
            placeholder: 'Options',
            options: {
              option_a: { name: 'Option A' },
              option_b: { name: 'Option B' },
              option_c: { name: 'Option C' },
            },
            help: 'Select an option from the combobox',
          },
          comboBoxMultiExample: {
            name: 'ComboBox Multi Example',
            type: 'selector',
            variant: 'comboboxMulti',
            placeholder: 'Select multiple options',
            options: {
              option_a: { name: 'Option A' },
              option_b: { name: 'Option B' },
              option_c: { name: 'Option C' },
            },
            help: 'Select multiple options from the combobox',
          },
          nestedItemExample: {
            name: 'Nested Item Example',
            type: 'selector',
            variant: 'nested',
            options: {
              t1_b1_tw1: {
                name: 'Twig1',
                path: ['Tree1', 'Branch1'],
              },
              t1_b1_tw2: {
                name: 'Twig2',
                path: ['Tree1', 'Branch1'],
              },
              t1_b1_tw3: {
                name: 'Twig3',
                path: ['Tree1', 'Branch1'],
              },
              t1_b2_tw1: {
                name: 'Twig1',
                path: ['Tree1', 'Branch2'],
              },
              t1_b2_tw2: {
                name: 'Twig2',
                path: ['Tree1', 'Branch2'],
              },
              t2_b1_tw1: {
                name: 'Twig1',
                path: ['Tree2', 'Branch1'],
              },
              t2_b1_tw2: {
                name: 'Twig2',
                path: ['Tree2', 'Branch1'],
              },
              t2_b2_tw1: {
                name: 'Twig1',
                path: ['Tree2', 'Branch2'],
              },
              t2_b2_tw2: {
                name: 'Twig2',
                path: ['Tree2', 'Branch2'],
              },
            },
            help: 'Select all relevant items',
          },
          dateTimeHeader: {
            name: 'Date and Time Props',
            type: 'head',
            help: 'Some help for Date and Time Props',
          },
          dateItemExample: {
            name: 'Date Example',
            type: 'date',
            variant: 'date',
            help: 'The Eagle has landed!',
          },
          timeItemExample: {
            name: 'Time Example',
            type: 'date',
            variant: 'time',
            views: ['hours', 'minutes', 'seconds'],
            help: 'The Eagle has landed!',
          },
          dateTimeItemExample: {
            name: 'Date and Time Example',
            type: 'date',
            variant: 'datetime',
            help: 'The Eagle has landed!',
          },
          coordinateHeader: {
            name: 'Coordinate Props',
            type: 'head',
            help: 'Some help for Coordinate Props',
          },
          latLngInputExample: {
            name: 'Lat/Lng Input Example',
            type: 'coordinate',
            variant: 'latLngInput',
            help: 'Help for the latLngInput example',
          },
          latLngMapExample: {
            name: 'Lat/Lng Map Example',
            type: 'coordinate',
            variant: 'latLngMap',
            help: 'Help for the latLngMap example',
          },
          latLngPathExample: {
            name: 'Lat/Lng Path Example',
            type: 'coordinate',
            variant: 'latLngPath',
            help: 'Help for the latLngPath example',
          },
        },
        values: {
          numericInputExample: 50,
          numericSliderExample: 50,
          incrementalSliderExample: 50,
          toggleSwitchExample: true,
          toggleButtonExample: false,
          toggleCheckboxExample: false,
          filledButtonExample: 'Press Me!',
          outlinedButtonExample: 'Press Me to Throw an Error!',
          textButtonExample: 'Press Me to Show a Warning!',
          pictureExample:
            'https://cave.mit.edu/wp-content/uploads/2019/01/CAVE_CTL_Live.png',
          videoExample: 'https://www.youtube.com/embed/6q5R1TDmKnU',
          textInputExample: 'Example Text Here',
          textAreaInputExample:
            'Velit non incididunt velit quis commodo consequat velit nulla. Id sunt sint consequat do in. Et adipisicing aliqua voluptate eu consequat et dolore mollit sit veniam minim nisi tempor. Enim laboris proident ex magna. Duis culpa veniam et officia irure id qui id ad laborum deserunt dolor proident elit.',
          dropdownItemExample: ['option_c'],
          checkboxItemExample: ['option_a', 'option_c'],
          hcheckboxItemExample: ['option_b'],
          radioItemExample: ['option_a'],
          hstepperItemExample: ['option_c'],
          vstepperItemExample: ['option_c'],
          hradioItemExample: ['option_c'],
          comboBoxItemExample: ['option_b'],
          comboBoxMultiExample: ['option_a', 'option_b'],
          nestedItemExample: [
            't1_b1_tw1',
            't1_b1_tw2',
            't1_b2_tw2',
            't2_b1_tw1',
            't2_b1_tw2',
          ],
          dateItemExample: '1969-07-20',
          timeItemExample: '20:17:40',
          dateTimeItemExample: '1969-07-20T20:17:40',
          latLngInputExample: [[-71.092003, 42.360001]],
          latLngMapExample: [[-71.092003, 42.360001]],
          latLngPathExample: [
            [-71.092003, 42.360001],
            [-71.093003, 42.361001],
          ],
        },
        layout: {
          type: 'grid',
          numColumns: 5,
          numRows: 'auto',
          data: {
            col1Row1: {
              type: 'item',
              column: 1,
              row: 1,
              itemId: 'numericHeader',
            },
            col1Row2: {
              type: 'item',
              column: 1,
              row: 2,
              itemId: 'numericInputExample',
            },
            col1Row3: {
              type: 'item',
              column: 1,
              row: 3,
              itemId: 'numericSliderExample',
            },
            col1Row4: {
              type: 'item',
              column: 1,
              row: 4,
              itemId: 'incrementalSliderExample',
            },
            col2Row1: {
              type: 'item',
              column: 2,
              row: 1,
              itemId: 'textHeader',
            },
            col2Row2: {
              type: 'item',
              column: 2,
              row: 2,
              itemId: 'textInputExample',
            },
            col2Row3: {
              type: 'item',
              column: 2,
              row: 3,
              itemId: 'textAreaInputExample',
            },
            col3Row1: {
              type: 'item',
              column: 3,
              row: 1,
              itemId: 'toggleHeader',
            },
            col3Row2: {
              type: 'item',
              column: 3,
              row: 2,
              itemId: 'toggleSwitchExample',
            },
            col3Row3: {
              type: 'item',
              column: 3,
              row: 3,
              itemId: 'toggleButtonExample',
            },
            col3Row4: {
              type: 'item',
              column: 3,
              row: 4,
              itemId: 'toggleCheckboxExample',
            },
            col4Row1: {
              type: 'item',
              column: 4,
              row: 1,
              itemId: 'buttonHeader',
            },
            col4Row2: {
              type: 'item',
              column: 4,
              row: 2,
              itemId: 'filledButtonExample',
            },
            col4Row3: {
              type: 'item',
              column: 4,
              row: 3,
              itemId: 'outlinedButtonExample',
            },
            col4Row4: {
              type: 'item',
              column: 4,
              row: 4,
              itemId: 'textButtonExample',
            },
            col4Row5: {
              type: 'item',
              column: 4,
              row: 5,
              itemId: 'iconButtonExample',
            },
            col5Row1: {
              type: 'item',
              column: 5,
              row: 1,
              itemId: 'mediaHeader',
            },
            col5Row2: {
              type: 'item',
              column: 5,
              row: 2,
              itemId: 'pictureExample',
            },
            col5Row3: {
              type: 'item',
              column: 5,
              row: 3,
              itemId: 'videoExample',
            },
            col6Row1: {
              type: 'item',
              column: 6,
              row: 1,
              itemId: 'selectorHeader',
            },
            col6Row2: {
              type: 'item',
              column: 6,
              row: 2,
              itemId: 'dropdownItemExample',
            },
            col6Row3: {
              type: 'item',
              column: 6,
              row: 3,
              itemId: 'checkboxItemExample',
            },
            col6Row4: {
              type: 'item',
              column: 6,
              row: 4,
              itemId: 'radioItemExample',
            },
            col6Row5: {
              type: 'item',
              column: 6,
              row: 5,
              itemId: 'comboBoxItemExample',
            },
            col6Row6: {
              type: 'item',
              column: 6,
              row: 6,
              itemId: 'comboBoxMultiExample',
            },
            col6Row7: {
              type: 'item',
              column: 6,
              row: 7,
              itemId: 'hstepperItemExample',
            },
            col6Row8: {
              type: 'item',
              column: 6,
              row: 8,
              itemId: 'vstepperItemExample',
            },
            col6Row9: {
              type: 'item',
              column: 6,
              row: 9,
              itemId: 'hcheckboxItemExample',
            },
            col6Row10: {
              type: 'item',
              column: 6,
              row: 10,
              itemId: 'hradioItemExample',
            },
            col6Row11: {
              type: 'item',
              column: 6,
              row: 11,
              itemId: 'nestedItemExample',
            },
            col7Row1: {
              type: 'item',
              column: 7,
              row: 1,
              itemId: 'dateTimeHeader',
            },
            col7Row2: {
              type: 'item',
              column: 7,
              row: 2,
              itemId: 'dateItemExample',
            },
            col7Row3: {
              type: 'item',
              column: 7,
              row: 3,
              itemId: 'timeItemExample',
            },
            col7Row4: {
              type: 'item',
              column: 7,
              row: 4,
              itemId: 'dateTimeItemExample',
            },
            col8Row1: {
              type: 'item',
              column: 8,
              row: 1,
              itemId: 'coordinateHeader',
            },
            col8Row2: {
              type: 'item',
              column: 8,
              row: 2,
              itemId: 'latLngInputExample',
            },
            col8Row3: {
              type: 'item',
              column: 8,
              row: 3,
              itemId: 'latLngMapExample',
            },
            col8Row4: {
              type: 'item',
              column: 8,
              row: 4,
              itemId: 'latLngPathExample',
            },
          },
        },
      },
    },
  },
  pages: {
    currentPage: 'dash2',
    data: {
      dash1: {
        charts: {
          allBar: {
            dataset: 'locationGroup',
            chartType: 'bar',
            stats: [
              {
                statId: 'numericStatExampleB',
                aggregationType: 'mean',
              },
            ],
            groupingId: [],
            groupingLevel: [],
            showNA: true,
          },
          map1: {
            type: 'map',
            mapId: 'map1',
            maximized: true,
          },
          statBar: {
            dataset: 'locationGroup',
            chartType: 'bar',
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'sum',
              },
            ],
            groupingId: [],
            groupingLevel: [],
          },
        },
        pageLayout: ['allBar', 'map1', null, 'statBar'],
        lockedLayout: false,
      },
      dash2: {
        charts: {
          allBar: {
            dataset: 'locationGroup',
            chartType: 'bar',
            stats: [
              {
                statId: 'numericStatExampleB',
                aggregationType: 'mean',
              },
            ],
            groupingId: [],
            groupingLevel: [],
            showNA: true,
          },
          mixed: {
            type: 'groupedOutput',
            dataset: 'locationGroup',
            chartType: 'mixed',
            groupingId: ['location'],
            groupingLevel: ['state'],
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'sum',
              },
              {
                statId: 'numericStatExampleB',
                aggregationType: 'sum',
              },
            ],
            chartOptions: {
              leftChartType: 'bar',
              rightChartType: 'cumulative_line',
            },
          },
          boxPlot: {
            dataset: 'locationGroup',
            chartType: 'box_plot',
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'mean',
              },
            ],
            groupingId: ['sku'],
            groupingLevel: ['size'],
            showNA: true,
          },
          cumulativeLine: {
            dataset: 'locationGroup',
            chartType: 'cumulative_line',
            stats: [
              {
                statId: 'numericStatExampleB',
                aggregationType: 'sum',
              },
            ],
            groupingId: ['location', 'sku'],
            groupingLevel: ['state', 'sku'],
            defaultToZero: true,
          },
        },
        pageLayout: ['allBar', 'mixed', 'boxPlot', 'cumulativeLine'],
        lockedLayout: false,
      },
      dash3: {
        charts: {
          chart1: {
            type: 'groupedOutput',
            dataset: 'locationGroup',
            chartType: 'mixed',
            groupingId: ['sku', 'location'],
            groupingLevel: ['size', 'state'],
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'sum',
              },
              {
                statId: 'numericStatExampleB',
                aggregationType: 'sum',
              },
            ],
            chartOptions: {
              leftChartType: 'bar',
              rightChartType: 'cumulative_line',
            },
          },
          chart2: {
            type: 'groupedOutput',
            dataset: 'locationGroup',
            chartType: 'table',
            groupingId: ['sku'],
            groupingLevel: ['size'],
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'divisor',
                statIdDivisor: 'numericStatExampleB',
              },
              {
                statId: 'numericStatExampleB',
                aggregationType: 'sum',
              },
            ],
          },
        },
        pageLayout: ['chart1', 'chart2', null, null],
      },
    },
  },
  maps: {
    order: {
      additionalMapStyles: ['smoothLight', 'smoothDark'],
    },
    additionalMapStyles: {
      smoothLight: {
        name: 'Smooth Light',
        icon: 'fi/FiSun',
        spec: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
      },
      smoothDark: {
        name: 'Smooth Dark',
        icon: 'fi/FiMoon',
        spec: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
      },
      osmRasterTiles: {
        name: 'OSM Raster Tiles',
        icon: 'md/MdBrush',
        mapbox: true,
        spec: {
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution:
                "Map tiles by <a target='_top' rel='noopener' href='https://osmfoundation.org/'>OpenStreetMap</a>, under <a target='_top' rel='noopener' href='https://osmfoundation.org/copyright'>Open Database License</a>.",
            },
          },
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster',
              source: 'raster-tiles',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
        fog: {
          range: [0.5, 10],
          color: 'rgb(255, 255, 255)',
          highColor: 'rgb(36, 92, 223)',
          spaceColor: [
            'interpolate',
            ['linear'],
            ['zoom'],
            2,
            'orange',
            4,
            'blue',
          ],
          horizonBlend: [
            'interpolate',
            ['exponential', 1.2],
            ['zoom'],
            5,
            0.02,
            7,
            0.08,
          ],
          starIntensity: ['interpolate', ['linear'], ['zoom'], 5, 0.35, 6, 0],
        },
      },
      streets: {
        name: 'Streets',
        icon: 'md/MdStreetview',
        spec: 'mapbox://styles/mapbox/streets-v12',
      },
      outdoors: {
        name: 'Outdoors',
        icon: 'md/MdForest',
        spec: 'mapbox://styles/mapbox/outdoors-v12',
      },
      satellite: {
        name: 'Satellite',
        icon: 'md/MdSatelliteAlt',
        spec: 'mapbox://styles/mapbox/satellite-v9',
      },
      satellite_streets: {
        name: 'Satellite Streets',
        icon: 'md/MdSatellite',
        spec: 'mapbox://styles/mapbox/satellite-streets-v12',
      },
    },
    data: {
      map1: {
        order: {
          optionalViewports: ['ov0', 'ov1'],
          legendGroups: ['lga', 'lgb'],
        },
        name: 'Example Map 1',
        currentStyle: 'osmRasterTiles',
        currentProjection: 'globe',
        defaultViewport: {
          longitude: -75.447,
          latitude: 40.345,
          zoom: 4.66,
          pitch: 0,
          bearing: 0,
          maxZoom: 12,
          minZoom: 2,
        },
        optionalViewports: {
          ov0: {
            icon: 'fa/FaGlobeAsia',
            name: 'Asia',
            zoom: 4,
            pitch: 0,
            bearing: 0,
            maxZoom: 12,
            minZoom: 2,
            latitude: 30,
            longitude: 121,
          },
          ov1: {
            icon: 'fa/FaGlobeEurope',
            name: 'EMEA',
            zoom: 4,
            pitch: 0,
            bearing: 0,
            maxZoom: 12,
            minZoom: 2,
            latitude: 47,
            longitude: 14,
          },
        },
        legendGroups: {
          lga: {
            name: 'Legend Group A',
            data: {
              nodeTypeA: {
                value: true,
                colorBy: 'booleanPropExample',
                sizeBy: 'numericPropExampleA',
                allowGrouping: true,
                group: false,
                groupCalcBySize: 'sum',
                groupCalcByColor: 'mode',
                icon: 'fa6/FaIgloo',
                colorByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                  'selectorPropExample',
                ],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                  'selectorPropExample',
                ],
              },
              T1: {
                colorBy: 'numericPropExampleB',
                sizeBy: 'numericPropExampleA',
                value: true,
                colorByOptions: ['numericPropExampleA', 'numericPropExampleB'],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
              },
            },
          },
          lgb: {
            name: 'Legend Group B',
            data: {
              nodeTypeB: {
                value: true,
                colorBy: 'numericPropExampleB',
                sizeBy: 'numericPropExampleA',
                allowGrouping: true,
                group: true,
                groupCalcBySize: 'count',
                groupCalcByColor: 'and',
                icon: 'bs/BsBuilding',
                colorByOptions: ['numericPropExampleA', 'numericPropExampleB'],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                ],
              },
              T2: {
                colorBy: 'selectorPropExample',
                sizeBy: 'numericPropExampleB',
                value: true,
                lineStyle: 'dotted',
                colorByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
              },
              state: {
                value: true,
                colorBy: 'numericPropExampleC',
                icon: 'bs/BsHexagon',
                colorByOptions: ['numericPropExampleC', 'booleanPropExample'],
              },
              country: {
                value: false,
                colorBy: 'numericPropExampleC',
                icon: 'pi/PiMountains',
                colorByOptions: ['numericPropExampleC'],
              },
              customGeoJson: {
                value: false,
                colorBy: 'numericPropExampleC',
                icon: 'tb/TbLassoPolygon',
                colorByOptions: ['numericPropExampleC', 'booleanPropExample'],
              },
            },
          },
        },
      },
      map2: {
        order: {
          optionalViewports: ['ov0', 'ov1'],
          legendGroups: ['lga', 'lgb'],
        },
        name: 'Example Map 2',
        defaultViewport: {
          longitude: -75.447,
          latitude: 40.345,
          zoom: 4.66,
          pitch: 0,
          bearing: 0,
          maxZoom: 12,
          minZoom: 2,
        },
        optionalViewports: {
          ov0: {
            icon: 'fa/FaGlobeAsia',
            name: 'Asia',
            zoom: 4,
            pitch: 0,
            bearing: 0,
            maxZoom: 12,
            minZoom: 2,
            latitude: 30,
            longitude: 121,
          },
          ov1: {
            icon: 'fa/FaGlobeEurope',
            name: 'EMEA',
            zoom: 4,
            pitch: 0,
            bearing: 0,
            maxZoom: 12,
            minZoom: 2,
            latitude: 47,
            longitude: 14,
          },
        },
        legendGroups: {
          lga: {
            name: 'Legend Group A',
            data: {
              nodeTypeA: {
                value: true,
                colorBy: 'booleanPropExample',
                sizeBy: 'numericPropExampleA',
                icon: 'fa6/FaIgloo',
                colorByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                  'selectorPropExample',
                ],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                  'selectorPropExample',
                ],
              },
              T1: {
                colorBy: 'numericPropExampleA',
                sizeBy: 'numericPropExampleB',
                value: true,
                colorByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
              },
            },
          },
          lgb: {
            name: 'Legend Group B',
            data: {
              nodeTypeB: {
                value: true,
                colorBy: 'booleanPropExample',
                sizeBy: 'numericPropExampleB',
                icon: 'bs/BsBuilding',
                colorByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                ],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                ],
              },
              T2: {
                colorBy: 'numericPropExampleA',
                sizeBy: 'numericPropExampleB',
                value: true,
                lineStyle: 'dotted',
                colorByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
              },
              state: {
                value: true,
                colorBy: 'numericPropExampleC',
                icon: 'bs/BsHexagon',
                colorByOptions: ['numericPropExampleC', 'booleanPropExample'],
              },
              country: {
                value: false,
                colorBy: 'numericPropExampleC',
                icon: 'pi/PiMountains',
                colorByOptions: ['numericPropExampleC'],
              },
            },
          },
        },
      },
    },
  },
  mapFeatures: {
    data: {
      T1: {
        type: 'arc',
        name: 'Flow Type 1',
        geoJson: {
          geoJsonLayer:
            'https://raw.githubusercontent.com/MIT-CAVE/cave_app_extras/main/example_data/example.geojson',
          geoJsonProp: 'arc_id',
        },
        props: {
          numericPropExampleA: {
            name: 'Numeric Prop Example A',
            type: 'num',
            unit: 'A units',
            gradient: {
              scale: 'linear',
              notation: 'compact',
              data: [
                {
                  value: 'min',
                  color: 'rgb(233 0 0)',
                  size: '15px',
                  label: 'Small',
                },
                {
                  value: 'max',
                  color: 'rgb(96 2 2)',
                  size: '30px',
                },
              ],
            },
            help: 'Help for numeric prop example A',
          },
          numericPropExampleB: {
            name: 'Numeric Prop Example B',
            type: 'num',
            gradient: {
              data: [
                {
                  value: 0,
                  color: 'rgb(0 128 255)',
                  label: 'Very Low',
                  size: '5px',
                },
                {
                  value: 5,
                  color: 'rgb(0 200 150)',
                  label: 'Low-Mid',
                  size: '8px',
                },
                {
                  value: 8.5,
                  color: 'rgb(173 255 47)',
                  label: 'Nominal',
                },
                {
                  value: 15,
                  color: 'rgb(255 165 0)',
                  label: 'Moderate-High',
                  size: '10px',
                },
                {
                  value: 28,
                  color: 'rgb(255 69 0)',
                  label: 'Very High',
                  size: '12px',
                },
                {
                  value: 40,
                  color: 'rgb(255 0 0)',
                  label: 'Critical',
                  size: '15px',
                },
                {
                  value: 100,
                  label: 'Unrealistic',
                  size: '100px',
                },
              ],
            },
            unit: 'B units',
            help: 'Help for numeric prop example B',
          },
          selectorPropExample: {
            name: 'Example Categorical Prop',
            type: 'selector',
            variant: 'dropdown',
            options: {
              a: {
                name: 'A',
                color: 'rgb(128 255 255)',
                size: '3px',
              },
              b: {
                name: 'B',
                color: 'rgb(0 153 51)',
                size: '8px',
              },
              c: {
                name: 'C',
                color: 'rgb(0 0 128)',
                size: '13px',
              },
              d: {
                name: 'D',
                color: 'rgb(204 0 0)',
                size: '18px',
              },
              e: {
                name: 'E',
                color: 'rgb(153 77 0)',
                size: '23px',
              },
              f: {
                name: 'F',
                color: 'rgb(255 255 255)',
                size: '28px',
              },
              g: {
                name: 'G',
                color: 'rgb(0 255 0)',
                size: '33px',
              },
              h: {
                name: 'H',
                color: 'rgb(255 255 0)',
                size: '38px',
              },
            },
          },
        },
        layout: {
          type: 'grid',
          numColumns: 'auto',
          numRows: 1,
          data: {
            col1: {
              type: 'item',
              itemId: 'numericPropExampleA',
              column: 1,
            },
            col2: {
              type: 'item',
              itemId: 'numericPropExampleB',
              column: 2,
            },
            col3: {
              type: 'item',
              itemId: 'selectorPropExample',
              column: 3,
            },
          },
        },
        data: {
          location: {
            geoJsonValue: ['toronto-pittsburgh-indianapolis'],
          },
          valueLists: {
            numericPropExampleA: [15],
            numericPropExampleB: [40],
            selectorPropExample: [['b']],
          },
        },
      },
      T2: {
        type: 'arc',
        name: 'Flow Type 2',
        props: {
          numericPropExampleA: {
            name: 'Numeric Prop Example A',
            type: 'num',
            gradient: {
              data: [
                {
                  value: 0,
                  color: 'rgb(233 0 0)',
                  size: '15px',
                },
                {
                  value: 'max',
                  color: 'rgb(96 2 2)',
                  size: '30px',
                },
              ],
            },
            help: 'Help for numeric prop example A',
            unit: 'A units',
          },
          numericPropExampleB: {
            name: 'Numeric Prop Example B',
            type: 'num',
            gradient: {
              data: [
                {
                  value: 'min',
                  color: 'rgb(233 0 0)',
                  size: '5px',
                },
                {
                  value: 'max',
                  color: 'rgb(96 2 2)',
                  size: '15px',
                },
              ],
            },
            help: 'Help for numeric prop example B',
            unit: 'B units',
          },
          selectorPropExample: {
            name: 'Example Categorical Prop',
            type: 'selector',
            variant: 'dropdown',
            options: {
              a: {
                name: 'A',
                color: 'rgb(128 255 255)',
                size: '3px',
              },
              b: {
                name: 'B',
                color: 'rgb(0 153 51)',
                size: '8px',
              },
              c: {
                name: 'C',
                color: 'rgb(0 0 128)',
                size: '13px',
              },
              d: {
                name: 'D',
                color: 'rgb(204 0 0)',
                size: '18px',
              },
              e: {
                name: 'E',
                color: 'rgb(153 77 0)',
                size: '23px',
              },
              f: {
                name: 'F',
                color: 'rgb(255 25 255)',
                size: '28px',
              },
              g: {
                name: 'G',
                color: 'rgb(0 255 0)',
                size: '33px',
              },
              h: {
                name: 'H',
                color: 'rgb(255 255 0)',
                size: '38px',
              },
            },
          },
        },
        layout: {
          type: 'grid',
          numColumns: 1,
          numRows: 'auto',
          data: {
            row1: {
              type: 'item',
              itemId: 'numericPropExampleA',
              row: 1,
            },
            row2: {
              type: 'item',
              itemId: 'numericPropExampleB',
              row: 2,
            },
            row3: {
              type: 'item',
              itemId: 'selectorPropExample',
              row: 3,
            },
          },
        },
        data: {
          location: {
            path: [
              [
                [-86.18, 39.82],
                [-84.39, 41.82],
                [-85.68, 42.89],
              ],
              [
                [-86.18, 39.82],
                [-81.56, 28.49],
              ],
              [
                [-86.18, 39.82],
                [-71.08, 42.36],
              ],
            ],
          },
          valueLists: {
            numericPropExampleA: [30, 30, 30],
            numericPropExampleB: [20, 14, 6],
            selectorPropExample: [['e'], ['d'], ['f']],
          },
        },
      },
      nodeTypeA: {
        type: 'node',
        name: 'Node Type A',
        props: {
          numericPropExampleA: {
            name: 'Numeric Prop Example A',
            type: 'num',
            unit: 'A units',
            gradient: {
              notation: 'precision',
              precision: 5,
              data: [
                {
                  value: 0,
                  color: 'rgb(233 0 0)',
                  size: '30px',
                },
                {
                  value: 80,
                  color: 'rgb(96 2 2)',
                  size: '45px',
                },
              ],
            },
            fallback: {
              name: 'Outlier',
              color: 'rgb(128 128 128)',
              size: '20px',
            },
            help: 'Help for numeric prop example A',
          },
          numericPropExampleB: {
            name: 'Numeric Prop Example B',
            type: 'num',
            unit: 'B units',
            gradient: {
              notation: 'scientific',
              notationDisplay: 'x10^',
              data: [
                {
                  value: 0,
                  color: 'rgb(233 0 0)',
                  size: '10px',
                },
                {
                  value: 'max',
                  color: 'rgb(96 2 2)',
                  size: '70px',
                },
              ],
            },
            help: 'Help for numeric prop example B',
          },
          booleanPropExample: {
            name: 'Boolean Prop Example',
            type: 'toggle',
            options: {
              false: {
                name: 'Idle',
                color: 'rgb(255 0 0)',
                size: '15px',
              },
              true: {
                name: 'Active',
                color: 'rgb(0 255 0)',
                size: '30px',
              },
            },
            fallback: {
              name: 'Unknown',
              color: 'rgb(128 128 128)',
              size: '100px',
            },
            help: 'Help for boolean prop',
          },
          selectorPropExample: {
            name: 'Example Categorical Prop',
            type: 'selector',
            variant: 'dropdown',
            options: {
              a: {
                name: 'A',
                color: 'rgb(128 255 255)',
                size: '3px',
              },
              b: {
                name: 'B',
                color: 'rgb(0 153 51)',
                size: '8px',
              },
              c: {
                name: 'C',
                color: 'rgb(0 0 128)',
                size: '13px',
              },
              d: {
                name: 'D',
                color: 'rgb(204 0 0)',
                size: '18px',
              },
              e: {
                name: 'E',
                color: 'rgb(153 77 0)',
                size: '23px',
              },
              f: {
                name: 'F',
                color: 'rgb(255 25 255)',
                size: '28px',
              },
              g: {
                name: 'G',
                color: 'rgb(0 255 0)',
                size: '33px',
              },
              h: {
                name: 'H',
                color: 'rgb(255 255 0)',
                size: '38px',
              },
            },
          },
        },
        data: {
          location: {
            timeValues: {
              0: {
                latitude: [[43.78], [39.82]],
              },
              1: {
                latitude: [[44.78], [39.82]],
              },
              2: {
                latitude: [[45.78], [39.82]],
              },
            },
            latitude: [[43.78], [39.82]],
            longitude: [[-79.63], [-86.18]],
          },
          valueLists: {
            numericPropExampleA: [100, 80],
            numericPropExampleB: [50, 40],
            booleanPropExample: [true, true],
            selectorPropExample: [['a'], ['b']],
          },
        },
      },
      nodeTypeB: {
        type: 'node',
        name: 'Node Type B',
        props: {
          numericPropExampleA: {
            name: 'Numeric Prop Example A',
            type: 'num',
            unit: 'A units',
            gradient: {
              notation: 'precision',
              precision: 5,
              data: [
                {
                  value: 'min',
                  color: 'rgb(233 0 0)',
                  size: '15px',
                },
                {
                  value: 'max',
                  color: 'rgb(96 2 2)',
                  size: '30px',
                },
              ],
            },
            help: 'Help for numeric prop example A',
          },
          numericPropExampleB: {
            name: 'Numeric Prop Example B',
            type: 'num',
            unit: 'B units',
            gradient: {
              data: [
                {
                  value: 0,
                  color: 'rgb(233 0 0)',
                  size: '5px',
                  label: 'Lo',
                },
                {
                  value: 10,
                  size: '40px',
                  color: 'rgb(150 1 1)',
                },
                {
                  value: 250,
                  color: 'rgb(96 2 2)',
                  size: '70px',
                  label: 'Hi',
                },
              ],
            },
            help: 'Help for numeric prop example B',
          },
          booleanPropExample: {
            name: 'Boolean Prop Example',
            type: 'toggle',
            options: {
              false: { color: 'rgb(233 0 0)' },
              true: { color: 'rgb(0 233 0)' },
            },
            help: 'Help for boolean prop',
          },
        },
        data: {
          location: {
            latitude: [[42.89], [28.49], [42.361176]],
            longitude: [[-85.68], [-81.56], [-71.084707]],
          },
          valueLists: {
            numericPropExampleA: [500, 1000, 1000],
            numericPropExampleB: [150, 250, 250],
            booleanPropExample: [true, true, true],
          },
        },
      },
      state: {
        type: 'geo',
        name: 'State',
        geoJson: {
          geoJsonLayer:
            'https://geojsons.mitcave.com/world/world-states-provinces-md.json',
          geoJsonProp: 'code_hasc',
        },
        props: {
          numericPropExampleC: {
            name: 'Numeric Prop Example C',
            type: 'num',
            unit: 'C units',
            gradient: {
              scale: 'log',
              scaleParams: {
                exponent: 0.5,
              },
              data: [
                {
                  value: 1,
                  color: 'rgb(200 230 255)',
                  label: 'Very Sparse',
                },
                {
                  value: 100,
                  color: 'rgb(120 180 240)',
                  label: 'Sparse',
                },
                {
                  value: 1000,
                  color: 'rgb(50 130 220)',
                  label: 'Moderate',
                },
                {
                  value: 5000,
                  color: 'rgb(255 140 0)',
                  label: 'Dense',
                },
                {
                  value: 10000,
                  color: 'rgb(255 0 0)',
                  label: 'Very Dense',
                },
              ],
            },
            help: 'Help with the example numeric prop for this State',
          },
          booleanPropExample: {
            name: 'Boolean Prop Example',
            type: 'toggle',
            options: {
              false: { color: 'rgb(233 0 0)' },
              true: { color: 'rgb(0 233 0)' },
            },
            help: 'Help for boolean prop',
          },
        },
        data: {
          location: {
            geoJsonValue: ['CA.ON', 'US.MI', 'US.MA', 'US.FL', 'US.IN'],
          },
          valueLists: {
            numericPropExampleC: [1, 8000, 250, 50, 2000],
            booleanPropExample: [true, true, false, false, false],
          },
        },
      },
      country: {
        type: 'geo',
        name: 'Country',
        geoJson: {
          geoJsonLayer: 'https://geojsons.mitcave.com/world/countries-sm.json',
          geoJsonProp: 'FIPS_10',
        },
        props: {
          numericPropExampleC: {
            name: 'Numeric Prop Example C',
            type: 'num',
            unit: 'units',
            gradient: {
              data: [
                {
                  value: 'min',
                  color: 'rgb(100 100 100)',
                },
                {
                  value: 'max',
                  color: 'rgb(20 205 20)',
                },
              ],
            },
            help: 'Help with the example numeric prop for this Country',
          },
        },
        data: {
          location: {
            geoJsonValue: ['CA', 'US'],
          },
          valueLists: {
            numericPropExampleC: [50, 800],
          },
        },
      },
      customGeoJson: {
        type: 'geo',
        name: 'Custom',
        props: {
          numericPropExampleC: {
            name: 'Numeric Prop Example C',
            type: 'num',
            unit: 'units',
            gradient: {
              data: [
                {
                  value: 'min',
                  color: 'rgb(100 100 100)',
                },
                {
                  value: 'max',
                  color: 'rgb(20 205 20)',
                },
              ],
            },
            help: 'Help with the example numeric prop for this Custom',
          },
          booleanPropExample: {
            name: 'Boolean Prop Example',
            type: 'toggle',
            options: {
              false: { color: 'rgb(233 0 0)' },
              true: { color: 'rgb(0 233 0)' },
            },
            help: 'Help for boolean prop',
          },
        },
        data: {
          location: {
            path: [
              [
                [-75.447, 40.345],
                [-77.447, 42.345],
                [-77.447, 44.345],
                [-75.447, 40.345],
              ],
            ],
          },
          valueLists: {
            numericPropExampleC: [100],
            booleanPropExample: [true],
          },
        },
      },
    },
  },
  groupedOutputs: {
    order: {
      groupings: ['location', 'sku'],
    },
    groupings: {
      location: {
        order: {
          levels: ['region', 'country', 'state'],
        },
        data: {
          id: ['locUsMi', 'locUsMa', 'locUsFl', 'locUsIn', 'locCaOn'],
          region: [
            'North America',
            'North America',
            'North America',
            'North America',
            'North America',
          ],
          country: ['USA', 'USA', 'USA', 'USA', 'Canada'],
          state: ['Michigan', 'Massachusetts', 'Florida', 'Indiana', 'Ontario'],
        },
        name: 'Locations',
        levels: {
          region: {
            name: 'Regions',
            coloring: { 'North America': 'rgb(255 255 255)' },
          },
          country: {
            name: 'Countries',
            ordering: ['Canada', 'USA'],
            parent: 'region',
            coloring: {
              Canada: 'rgb(0 0 255)',
              USA: 'rgb(255 0 0)',
            },
          },
          state: {
            name: 'States',
            parent: 'country',
            ordering: [
              'Michigan',
              'Florida',
              'Indiana',
              'Massachusetts',
              'Ontario',
            ],
            orderWithParent: false,
          },
        },
        layoutDirection: 'horizontal',
        grouping: 'Solo',
      },
      sku: {
        order: {
          levels: ['type', 'size', 'sku'],
        },
        data: {
          id: ['SKU1', 'SKU2'],
          type: ['Type A', 'Type A'],
          size: ['Size A', 'Size B'],
          sku: ['SKU1', 'SKU2'],
        },
        name: 'SKUs',
        levels: {
          type: {
            name: 'Types',
          },
          size: {
            name: 'Sizing',
            ordering: ['Size B', 'Size A'],
          },
          sku: {
            name: 'SKU',
          },
        },
        layoutDirection: 'horizontal',
      },
    },
    data: {
      locationGroup: {
        order: {
          stats: ['numericStatExampleA', 'numericStatExampleB'],
        },
        stats: {
          numericStatExampleA: {
            name: 'Stat Example A',
            unit: 'units',
          },
          numericStatExampleB: {
            name: 'Stat Example B',
            unit: 'units',
          },
        },
        valueLists: {
          numericStatExampleA: [5, 4, 6, -3, -3, 1],
          numericStatExampleB: [10, 5, 7, 5, -2, -1],
        },
        groupLists: {
          location: [
            'locCaOn',
            'locCaOn',
            'locUsMi',
            'locUsMi',
            'locUsIn',
            'locUsFl',
          ],
          sku: ['SKU1', 'SKU2', 'SKU1', 'SKU2', 'SKU2', 'SKU2'],
        },
      },
      skuGroup: {
        stats: {
          numericStatExampleD: {
            name: 'Stat Example D',
            unit: 'units',
          },
        },
        valueLists: { numericStatExampleD: [10, 15] },
        groupLists: {
          sku: ['SKU1', 'SKU2'],
        },
      },
    },
  },
  globalOutputs: {
    props: {
      kpiHeader1: {
        type: 'head',
        name: 'Example KPI Header 1',
        icon: 'bs/BsInboxes',
        variant: 'icon',
      },
      kpiHeader2: {
        type: 'head',
        name: 'Example KPI Header 2',
        icon: 'bs/BsTruck',
        variant: 'icon',
      },
      key1: {
        name: 'KPI Example 1',
        icon: 'bs/BsFillEmojiFrownFill',
        precision: 0,
        unit: 'frowns',
        type: 'num',
        variant: 'icon',
        draggable: true,
      },
      key2: {
        name: 'KPI Example 2',
        icon: 'bs/BsFillEmojiSmileFill',
        precision: 0,
        unit: 'smiles',
        type: 'num',
        variant: 'icon',
        draggable: true,
      },
      key3: {
        name: 'KPI Example 3',
        icon: 'bs/BsInboxes',
        precision: 4,
        notation: 'scientific',
        notationDisplay: 'E+',
        trailingZeros: true,
        unit: 'units',
        type: 'num',
        variant: 'icon',
      },
      key4: {
        name: 'A Big Number',
        icon: 'bs/BsTruck',
        notation: 'engineering',
        notationDisplay: 'x10^',
        precision: 0,
        unit: 'units',
        type: 'num',
        variant: 'icon',
      },
      key5: {
        name: 'A Really Big Number',
        icon: 'md/MdExpand',
        precision: 2,
        unit: '$',
        unitPlacement: 'before',
        notation: 'compact',
        notationDisplay: 'long',
        trailingZeros: true,
        type: 'num',
        variant: 'icon',
      },
      key6: {
        name: 'A Decent Big Number',
        icon: 'md/MdExpand',
        precision: 2,
        unit: '$',
        unitPlacement: 'before',
        notation: 'compact',
        notationDisplay: 'long',
        trailingZeros: true,
        type: 'num',
        variant: 'icon',
      },
    },
    values: {
      key1: 18,
      key2: 32,
      key3: 100,
      key4: 10000000000000,
      key5: 9007199254740991,
      key6: 199254740991,
    },
    layout: {
      type: 'grid',
      numColumns: 'auto',
      numRows: 'auto',
      data: {
        col1Row1: {
          type: 'item',
          itemId: 'kpiHeader1',
          column: 1,
          row: 1,
        },
        col1Row2: {
          type: 'item',
          itemId: 'key1',
          column: 1,
          row: 2,
        },
        col1Row3: {
          type: 'item',
          itemId: 'key4',
          column: 1,
          row: 3,
        },
        col1Row4: {
          type: 'item',
          itemId: 'key5',
          column: 1,
          row: 4,
        },
        col2Row1: {
          type: 'item',
          itemId: 'kpiHeader2',
          column: 2,
          row: 1,
        },
        col2Row2: {
          type: 'item',
          itemId: 'key2',
          column: 2,
          row: 2,
        },
        col2Row3: {
          type: 'item',
          itemId: 'key3',
          column: 2,
          row: 3,
        },
        col1Row5: {
          type: 'item',
          itemId: 'key6',
          column: 1,
          row: 5,
        },
      },
    },
  },
  extraKwargs: {
    wipeExisting: true,
  },
}

const kitchenSinkStories = {
  title: 'Workspaces/KitchenSink',
  component: App,
  parameters: {
    initData,
    layout: 'fullscreen',
    layoutWidth: 'full',
  },
}

export default kitchenSinkStories

export const Default = {
  render: () => <App />,
  play: async ({ canvasElement }) => {
    // Wait for initial render and async chart computations to complete
    await new Promise((resolve) => setTimeout(resolve, 500))
    // When ErrorBoundary catches an unhandled render exception, it renders SessionPane.
    // Assert that the app loaded successfully and did NOT fall back to SessionPane.
    const canvas = within(canvasElement)
    expect(canvas.queryByText('Sessions Pane')).toBeNull()
    expect(document.body.textContent).not.toContain('Sessions Pane')
  },
}
