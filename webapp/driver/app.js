(function (window, angular) {
    var app = angular.module("cab9.driver", [
      "ngMessages",
      "ngAnimate",
      'ngLocale', //DefaultLocale
      "ui.router",
      "ui.router.tabs",
      "ui.bootstrap",
      "ui.select",
      "ui-notification",
      "angular.filter",
      "angular-flot",
      'uiGmapgoogle-maps',
      'google.places',
      'tmh.dynamicLocale',
      //"framework.services.auth",
      "framework.services.auth.persist",
      "framework.services.menu",
      "framework.services.data",
      "framework.services.logging",
      "framework.services.storage",
      "framework.services.images",
      //"framework.services.rclick",
      "framework.services.csv",
      "framework.services.google",
      "framework.services.signalr",
      "framework.directives.utils",
      "framework.directives.UI",
       "framework.services.currency",
      "framework.filters.utility",
      "framework.UI.structure",
      "framework.UI.breadcrumb",
      "framework.UI.module",
      "framework.UI",
      "framework.module.documents",
      "cab9.layout",
      "cab9.driver.bookings",
      "cab9.driver.vehicles",
      "cab9.driver.settings"
    ]);

    app.config(configFn);
    app.run(runFn);

    app.constant('$tenantConfig', {
        defaultVehicleType: '80e4cd2c-411e-41e0-9939-679ef65797cc',
        defaultVehicleClass: '80e4cd2c-411e-41e0-9939-679ef65797cc',
        officeLocation: {
            latitude: 51.471507,
            longitude: -0.487904
        }
    });
    window.$config = {
        API_ENDPOINT: window.endpoint,
        RESOURCE_ENDPOINT: window.resourceEndpoint,
        GMAPS_STATIC_URL: 'https://maps.googleapis.com/maps/api/staticmap?size=249x249&style=feature:landscape|visibility:off&style=feature:poi|visibility:off&style=feature:transit|visibility:off&style=feature:road.highway|element:geometry|lightness:39&style=feature:road.local|element:geometry|gamma:1.45&style=feature:road|element:labels|gamma:1.22&style=feature:administrative|visibility:off&style=feature:administrative.locality|visibility:on&style=feature:landscape.natural|visibility:on&scale=2',
        LOGIN_URL: '/index.html',
        DEFAULT_LOCALE: 'en-gb'
    };
    app.constant('$config', window.$config);


    app.constant('$UI', {
        COLOURS: {
            brandPrimary: '#2AA2AB',
            brandSecondary: '#3D799B',
            menuLight: '#2B303B',
            menuDark: '#21252D',
            blue: '#032b5a',
            red: '#F55753',
            yellow: '#F8D053',
            cyan: '#10CFBD',
            sky: '#48B0F7',
            green: '#64c458',
            purple: '#6D5CAE',
            brandGrey: '#3B4752',
            darkGrey: '#2B303B',
            lightGrey: 'rgba(100,100,100,0.1)',
            grey: '#788195',
            lighterGrey: 'rgba(0,0,0,0.2)'
        }
    });

    app.constant('LookupCache', {

    });

    app.constant('ViewerCache', {

    });

    configFn.$inject = ['$config', '$sceProvider', '$stateProvider', '$compileProvider', 'MenuServiceProvider', 'LoggerProvider', 'ModelProvider', 'datepickerConfig', 'SignalRProvider', 'NotificationProvider'];

    function configFn($config, $sceProvider, $stateProvider, $compileProvider, MenuServiceProvider, LoggerProvider, ModelProvider, datepickerConfig, SignalRProvider, NotificationProvider) {
        //AuthProvider.setTokenEndpoint($config.API_ENDPOINT + 'token');
        $sceProvider.enabled(false);
        SignalRProvider.setEndpoint($config.API_ENDPOINT + 'signalr/hubs');
        SignalRProvider.setHub('locationHub');
        SignalRProvider.setQueryValue('token', '');
        SignalRProvider.registerEvent('updateDriverLocation');

        datepickerConfig.showWeeks = false;
        datepickerConfig.showButtonBar = false;
        LoggerProvider.setGlobalLoggingLevel(5);
        LoggerProvider.addProvider('ConsoleLoggingProvider');
        LoggerProvider.hideCatagory('APP RUN');

        $stateProvider.state('root', {
            url: '',
            abstract: false,
            onEnter: function () {
                setTimeout(function () {
                    jQuery('.animation-root').removeClass('animation-root');
                }, 1000);
            },
            views: {
                'layout': {
                    templateUrl: '/e9_components/layouts/structure/page.layout.html'
                },
                'sidebar-left@root': {
                    templateUrl: '/webapp/layout/sidebar-left/sidebar-left.partial.html',
                    controller: 'SidebarController'
                },
                'topbar@root': {
                    templateUrl: '/webapp/layout/topbar/topbar.partial.html',
                    controller: 'TopBarController'
                },
                'sidebar-right@root': {
                    templateUrl: '/webapp/layout/sidebar-right/sidebar-right.partial.html'
                }
            }
        });

        NotificationProvider.setOptions({
            delay: 3000,
            startTop: 20,
            startRight: 10,
            verticalSpacing: 20,
            horizontalSpacing: 20,
            positionX: 'right',
            positionY: 'top'
        });

        function getInitials(text) {
            if (text.indexOf(' ') == -1) {
                return text[0];
            } else {
                var split = text.split(' ');
                var result = '';
                for (var i = 0; i < split.length; i++) {
                    result += split[i][0];
                }
                return result;
            }
        }

        ModelProvider.registerSchema('Driver', 'api/drivers', {
            Id: {
                type: String,
                editable: false,
                required: true,
                validators: [],
                table: {
                    visible: false
                }
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            DriverTypeId: {
                type: String,
                required: true,
                displayField: 'DriverType.Name',
                table: {
                    hidden: true
                }
            },
            DriverType: {
                type: 'DriverType',
                ref: 'DriverType',
                refBy: 'DriverTypeId',
                table: {
                    hidden: true
                }
            },
            Firstname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Surname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            _Fullname: {
                type: String,
                calculated: function () {
                    return (this.Firstname + ' ' + this.Surname);
                },
                display: 'Full Name'
            },
            Callsign: {
                type: String,
                required: true
            },
            Nationality: {
                type: String,
                table: {
                    visible: false
                }
            },
            DateOfBirth: {
                type: moment,
                displayFilters: " | date:'shortDate'",
                table: {
                    visible: false
                }
            },
            Address1: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Address2: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Area: {
                type: String,
                table: {
                    hidden: true
                }
            },
            TownCity: {
                type: String,
                display: 'Town/City'
            },
            County: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Postcode: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Country: {
                type: String,
                table: {
                    hidden: true
                }
            },
            _FullAddress: {
                type: String,
                calculated: function () {
                    var summary = '';
                    summary += this.Address1 ? (this.Address1 + '\n') : '';
                    summary += this.Address2 ? (this.Address2 + '\n') : '';
                    summary += this.Area ? (this.Area + '\n') : '';
                    summary += this.TownCity ? (this.TownCity + '\n') : '';
                    summary += this.Postcode ? (this.Postcode + '\n') : '';
                    summary += this.County ? (this.County + '\n') : '';
                    summary += this.Country ? this.Country : '';
                    return summary;
                },
                table: {
                    visible: false
                },
                display: 'Full Address'
            },
            Phone: {
                type: String,
                table: {
                    visible: false
                }
            },
            Mobile: {
                type: String
            },
            Fax: {
                type: String,
                table: {
                    visible: false
                }
            },
            Email: {
                type: String
            },
            StartDate: {
                type: moment,
                displayFilters: " | date:'shortDate'",
                defaultValue: new moment().toDate(),
                table: {
                    visible: false
                }
            },
            EndDate: {
                type: moment,
                displayFilters: " | date:'shortDate'",
                required: false,
                table: {
                    visible: false
                }
            },
            Active: {
                type: Boolean,
                defaultValue: true,
                table: {
                    hidden: true
                }
            },
            ImageUrl: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            DriverTags: {
                type: ['DriverTag'],
                ref: 'DriverTag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            CreationTime: {
                type: moment,
                hidden: true
            },

            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    return window.formatImage(this.ImageUrl, this.Callsign.replace(/ /g, "+"));
                }
            }
        });

        ModelProvider.registerSchema('DriverType', 'api/drivertypes', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            }
        });

        ModelProvider.registerSchema('DriverTag', 'api/drivertags', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            Drivers: {
                type: ['Driver'],
                ref: 'Driver',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            }
        });

        ModelProvider.registerSchema('Company', 'api/companies', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String
            },
            PricingModelId: {
                type: String,
                display: 'Default Pricing Model',
                displayField: '_PricingModelName'
            },
            PricingModel: {
                type: 'PricingModel'
            },
            LogoUrl: {
                type: String
            },
            Address1: {
                type: String
            },
            Address2: {
                type: String
            },
            Area: {
                type: String
            },
            TownCity: {
                type: String,
                display: 'Town/City'
            },
            County: {
                type: String
            },
            Postcode: {
                type: String
            },
            Country: {
                type: String
            },
            _FullAddress: {
                type: String,
                calculated: function () {
                    var summary = '';
                    summary += this.Address1 ? (this.Address1 + '\n') : '';
                    summary += this.Address2 ? (this.Address2 + '\n') : '';
                    summary += this.Area ? (this.Area + '\n') : '';
                    summary += this.TownCity ? (this.TownCity + '\n') : '';
                    summary += this.Postcode ? (this.Postcode + '\n') : '';
                    summary += this.County ? (this.County + '\n') : '';
                    summary += this.Country ? this.Country : '';
                    return summary;
                },
                display: 'Address'
            },
            BillingAddress1: {
                type: String
            },
            BillingAddress2: {
                type: String
            },
            BillingArea: {
                type: String
            },
            BillingTownCity: {
                type: String,
                display: 'Town/City'
            },
            BillingCounty: {
                type: String
            },
            BillingPostcode: {
                type: String
            },
            BillingCountry: {
                type: String
            },
            _FullBillingAddress: {
                type: String,
                calculated: function () {
                    var summary = '';
                    summary += this.BillingAddress1 ? (this.BillingAddress1 + '\n') : '';
                    summary += this.BillingAddress2 ? (this.BillingAddress2 + '\n') : '';
                    summary += this.BillingArea ? (this.BillingArea + '\n') : '';
                    summary += this.BillingTownCity ? (this.BillingTownCity + '\n') : '';
                    summary += this.BillingPostcode ? (this.BillingPostcode + '\n') : '';
                    summary += this.BillingCounty ? (this.BillingCounty + '\n') : '';
                    summary += this.BillingCountry ? this.BillingCountry : '';
                    return summary;
                },
                display: 'Billing Address'
            },
            Phone: {
                type: String
            },
            Mobile: {
                type: String
            },
            Fax: {
                type: String
            },
            Email: {
                type: String
            },
            Website: {
                type: String
            },
            BaseLatitude: {
                type: Number
            },
            BaseLongitude: {
                type: Number
            },
            BaseZoom: {
                type: Number
            },
            UseSMTP: {
                type: Boolean
            },
            SMTPServer: {
                type: String
            },
            SMTPEmail: {
                type: String
            },
            SMTPUsername: {
                type: String
            },
            SMTPPassword: {
                type: String
            },
            SMTPPort: {
                type: Number
            },
            SMTPSecure: {
                type: Boolean
            },
            MailgunDomain: {
                type: String
            },
            MailgunKey: {
                type: String
            },
            MailgunFromEmail: {
                type: String
            },
            _PricingModelName: {
                type: String,
                calculated: function () {
                    return (this.PricingModel && this.PricingModel.Name);
                }
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    return window.formatImage(this.LogoUrl, this.Name.replace(/ /g, "+"));

                }
            },
            DefaultCurrencyId: {
                type: String,
                editable: false,
                display: 'Default Currency'
            },
            DefaultCurrency: {
                type: 'Currency',
                ref: 'Currency',
                refBy: 'DefaultCurrencyId'
            },
            DefaultLocale: {
                type: String,
                display: 'Locale'
            },
            DefaultTimezone: {
                type: String,
                display: 'Timezone'
            },
            UseMetric: {
                type: Boolean,
                defaultValue: false,
            },
            ChauffeurModeActive: {
                type: Boolean
            },
            BankName: {
                type: String,
                display: "Bank Name"
            },
            AccountNumber: {
                type: String,
                display: "Account Number"
            },
            SortCode: {
                type: String,
                display: "Sort Code"
            },
            IBAN: {
                type: String,
                display: "IBAN Number"
            },
            BIC: {
                type: String,
                display: "BIC Code"
            },
            DefaultInvoicePaymentInstructions: {
                type: String,
                textarea: 4,
                display: "Default Payment Advice"
            },
            DefaultTaxId: {
                type: String,
                display: 'Default Tax',
                displayField: '_DefaultTax'
            },
            DefaultTax: {
                type: 'Tax'
            }
        });

        ModelProvider.registerSchema('Vehicle', 'api/vehicles', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            VehicleClassId: {
                type: String,
                required: true,
                displayField: 'Class.Name',
                table: {
                    hidden: true
                }
            },
            Class: {
                type: 'VehicleClass',
                ref: 'VehicleClass',
                refBy: 'VehicleClassId',
                table: {
                    hidden: true
                }
            },
            VehicleTypeId: {
                type: String,
                required: true,
                displayField: 'Type.Name',
                table: {
                    hidden: true
                }
            },
            Type: {
                type: 'VehicleType',
                ref: 'VehicleType',
                refBy: 'VehicleTypeId',
                table: {
                    hidden: true
                }
            },
            Make: {
                type: String,
                required: true,
                table: {
                    visible: false
                }
            },
            Model: {
                type: String,
                required: true,
                table: {
                    visible: false
                }
            },
            Colour: {
                type: String,
                required: true,
                table: {
                    visible: false
                }
            },
            RegYear: {
                type: String,
                required: true,
                table: {
                    visible: false
                }
            },
            _Description: {
                type: String,
                calculated: function () {
                    return (this.Colour + ' ' + this.Make + ' ' + this.Model);
                },
                display: 'Description'
            },
            Registration: {
                type: String,
                required: true,
                display: 'Registration No.'
            },
            Description: {
                type: String
            },
            Pax: {
                type: Number,
                defaultValue: 4,
                table: {
                    hidden: true
                },
                display: 'Max. Passengers'
            },
            Bax: {
                type: Number,
                defaultValue: 1,
                table: {
                    hidden: true
                },
                display: 'Max. Baggage'
            },
            Wheelchairs: {
                type: Number,
                defaultValue: 0,
                table: {
                    hidden: true
                },
                display: 'Max. Wheelchairs'
            },
            StartDate: {
                type: moment,
                required: false,
                defaultValue: new moment().toDate(),
                displayFilters: " | date:'shortDate'",
                table: {
                    visible: false
                }
            },
            EndDate: {
                type: moment,
                required: false,
                displayFilters: " | date:'shortDate'",
                table: {
                    visible: false
                }
            },
            Active: {
                type: Boolean,
                defaultValue: true,
                table: {
                    hidden: true
                }
            },
            ImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            DriverId: {
                type: String,
                displayField: 'Driver._Fullname',
                table: {
                    hidden: true
                }
            },
            Driver: {
                type: 'Driver',
                ref: 'Driver',
                refBy: 'DriverId',
                table: {
                    hidden: true
                }
            },
            VehicleTags: {
                type: ['VehicleTag'],
                ref: 'VehicleTag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            CreationTime: {
                type: moment,
                hidden: true
            },
            ScoreOverall: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ScoreBooking: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ScoreRevenue: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    return $config.API_ENDPOINT + 'api/imagegen?type=plate&text=' + this.Registration.replace(/ /g, "+");
                }
            }
        });

        ModelProvider.registerSchema('VehicleType', 'api/vehicletypes', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            Vehicles: {
                type: ['Vehicle'],
                ref: 'Vehicle',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            }
        });

        ModelProvider.registerSchema('VehicleClass', 'api/vehicleclasses', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            Vehicles: {
                type: ['Vehicle'],
                ref: 'Vehicle',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            }
        });

        ModelProvider.registerSchema('VehicleTag', 'api/vehicletags', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            Vehicles: {
                type: ['Vehicle'],
                ref: 'Vehicle',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            }
        });

        ModelProvider.registerSchema('Document', 'api/documents', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            DocumentTypeId: {
                type: String,
                required: true,
                displayField: 'DocumentType.Name',
                table: {
                    hidden: true
                }
            },
            DocumentType: {
                type: 'DocumentType',
                ref: 'DocumentType',
                refBy: 'DocumentTypeId',
                table: {
                    hidden: true
                }
            },
            IssuedBy: {
                type: String
            },
            IssueDate: {
                type: moment,
                required: false,
                displayFilters: " | date:'dd/MM/yyyy'",
                table: {
                    visible: false
                }
            },
            ExpiryDate: {
                type: moment,
                required: false,
                displayFilters: " | date:'dd/MM/yyyy'",
                table: {
                    visible: false
                }
            },
            FileType: {
                type: String
            },
            FilePath: {
                type: String
            },
            ThumbnailPath: {
                type: String
            },
            OwnerType: {
                type: String
            },
            OwnerId: {
                type: String,
                editable: false,
                hidden: true
            }
        });

        ModelProvider.registerSchema('DocumentType', 'api/documenttypes', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            }
        });

        ModelProvider.registerSchema('Client', 'api/clients', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            ClientTypeId: {
                type: String,
                required: true,
                displayField: 'ClientType.Name',
                table: {
                    hidden: true
                }
            },
            ClientType: {
                type: 'ClientType',
                ref: 'ClientType',
                refBy: 'ClientTypeId',
                table: {
                    hidden: true
                }
            },
            Name: {
                type: String,
                required: true
            },
            Address1: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Address2: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Area: {
                type: String,
                table: {
                    hidden: true
                }
            },
            TownCity: {
                type: String,
                display: 'Town/City'
            },
            County: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Postcode: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Country: {
                type: String,
                table: {
                    hidden: true
                }
            },
            _FullAddress: {
                type: String,
                calculated: function () {
                    var summary = '';
                    summary += this.Address1 ? (this.Address1 + '\n') : '';
                    summary += this.Address2 ? (this.Address2 + '\n') : '';
                    summary += this.Area ? (this.Area + '\n') : '';
                    summary += this.TownCity ? (this.TownCity + '\n') : '';
                    summary += this.Postcode ? (this.Postcode + '\n') : '';
                    summary += this.County ? (this.County + '\n') : '';
                    summary += this.Country ? this.Country : '';
                    return summary;
                },
                table: {
                    visible: false
                },
                display: 'Full Address'
            },
            BillingAddress1: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'Billing Address1'
            },
            BillingAddress2: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'Billing Address2'
            },
            BillingArea: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'Area'
            },
            BillingTownCity: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'TownCity'
            },
            BillingCounty: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'County'
            },
            BillingPostcode: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'PostCode'
            },
            BillingCountry: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'Country'
            },
            _FullBillingAddress: {
                type: String,
                calculated: function () {
                    var summary = '';
                    summary += this.BillingAddress1 ? (this.BillingAddress1 + '\n') : '';
                    summary += this.BillingAddress2 ? (this.BillingAddress2 + '\n') : '';
                    summary += this.BillingArea ? (this.BillingArea + '\n') : '';
                    summary += this.BillingTownCity ? (this.BillingTownCity + '\n') : '';
                    summary += this.BillingPostcode ? (this.BillingPostcode + '\n') : '';
                    summary += this.BillingCounty ? (this.BillingCounty + '\n') : '';
                    summary += this.BillingCountry ? this.BillingCountry : '';
                    return summary;
                },
                table: {
                    hidden: true
                },
                display: 'Full Billing Address'
            },
            Phone: {
                type: String,
                table: {
                    visible: false
                }
            },
            Mobile: {
                type: String,
            },
            Fax: {
                type: String,
            },
            Email: {
                type: String,
            },
            StartDate: {
                type: moment,
                displayFilters: " | date:'shortDate'",
                defaultValue: new moment().toDate(),
                table: {
                    visible: false
                }
            },
            EndDate: {
                type: moment,
                displayFilters: " | date:'shortDate'",
                table: {
                    visible: false
                }
            },
            Active: {
                type: Boolean,
                defaultValue: true,
                table: {
                    hidden: true
                }
            },
            ImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ClientTags: {
                type: ['ClientTag'],
                ref: 'ClientTag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            Passengers: {
                type: ['Passenger'],
                ref: 'Passenger',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            CreationTime: {
                type: moment,
                hidden: true
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    if (this.ImageUrl) {
                        if (this.ImageUrl.slice(0, 4) == 'http') {
                            return this.ImageUrl;
                        } else {
                            return $config.API_ENDPOINT + this.ImageUrl;
                        }
                    } else {
                        return $config.API_ENDPOINT + 'api/imagegen?text=' + this.Name.replace(/ /g, "+");
                    }
                }
            },
            DefaultCurrencyId: {
                type: String,
                display: 'Default Currency'
            },
            DefaultCurrency: {
                type: 'Currency',
                ref: 'Currency',
                refBy: 'DefaultCurrencyId'
            }
        });

        ModelProvider.registerSchema('ClientType', 'api/clienttypes', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            Clients: {
                type: ['Client'],
                ref: 'Client',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            }
        });

        ModelProvider.registerSchema('ClientTag', 'api/clienttags', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            Clients: {
                type: ['Client'],
                ref: 'Client',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            }
        });

        ModelProvider.registerSchema('Passenger', 'api/passengers', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Firstname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Surname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            _Fullname: {
                type: String,
                calculated: function () {
                    return (this.Firstname + ' ' + this.Surname);
                },
                display: 'Full Name'
            },
            ClientId: {
                type: String,
                displayField: 'Client.Name',
                table: {
                    hidden: true
                }
            },
            Client: {
                type: 'Client',
                ref: 'Client',
                refBy: 'ClientId',
                table: {
                    hidden: true
                }
            },
            DateOfBirth: {
                type: moment,
                displayFilters: " | date:'shortDate'",
                table: {
                    visible: false
                }
            },
            _ClientName: {
                type: String,
                calculated: function () {
                    if (this.ClientId && this.Client)
                        return this.Client.Name;
                },
                display: 'Client Name'
            },
            HomeAddress1: {
                type: String,
                table: {
                    hidden: true
                }
            },
            HomeAddress2: {
                type: String,
                table: {
                    hidden: true
                }
            },
            HomeArea: {
                type: String,
                table: {
                    hidden: true
                }
            },
            HomeTownCity: {
                type: String,
                table: {
                    hidden: true
                }
            },
            HomeCounty: {
                type: String,
                table: {
                    hidden: true
                }
            },
            HomePostcode: {
                type: String,
                table: {
                    hidden: true
                }
            },
            HomeCountry: {
                type: String,
                table: {
                    hidden: true
                }
            },
            _FullHomeAddress: {
                type: String,
                calculated: function () {
                    var summary = '';
                    summary += this.HomeAddress1 ? (this.HomeAddress1 + '\n') : '';
                    summary += this.HomeAddress2 ? (this.HomeAddress2 + '\n') : '';
                    summary += this.HomeArea ? (this.HomeArea + '\n') : '';
                    summary += this.HomeTownCity ? (this.HomeTownCity + '\n') : '';
                    summary += this.HomePostcode ? (this.HomePostcode + '\n') : '';
                    summary += this.HomeCounty ? (this.HomeCounty + '\n') : '';
                    summary += this.HomeCountry ? this.HomeCountry : '';
                    return summary;
                },
                table: {
                    visible: false
                },
                display: 'Full Home Address'
            },
            WorkAddress1: {
                type: String,
                table: {
                    hidden: true
                }
            },
            WorkAddress2: {
                type: String,
                table: {
                    hidden: true
                }
            },
            WorkArea: {
                type: String,
                table: {
                    hidden: true
                }
            },
            WorkTownCity: {
                type: String,
                table: {
                    hidden: true
                }
            },
            WorkCounty: {
                type: String,
                table: {
                    hidden: true
                }
            },
            WorkPostcode: {
                type: String,
                table: {
                    hidden: true
                }
            },
            WorkCountry: {
                type: String,
                table: {
                    hidden: true
                }
            },
            _FullWorkAddress: {
                type: String,
                calculated: function () {
                    var summary = '';
                    summary += this.WorkAddress1 ? (this.WorkAddress1 + '\n') : '';
                    summary += this.WorkAddress2 ? (this.WorkAddress2 + '\n') : '';
                    summary += this.WorkArea ? (this.WorkArea + '\n') : '';
                    summary += this.WorkTownCity ? (this.WorkTownCity + '\n') : '';
                    summary += this.WorkPostcode ? (this.WorkPostcode + '\n') : '';
                    summary += this.WorkCounty ? (this.WorkCounty + '\n') : '';
                    summary += this.WorkCountry ? this.WorkCountry : '';
                    return summary;
                },
                table: {
                    visible: false
                },
                display: 'Full Work Address'
            },
            Phone: {
                type: String,
                table: {
                    visible: false
                }
            },
            Mobile: {
                type: String,
            },
            Fax: {
                type: String,
            },
            Email: {
                type: String,
            },
            Active: {
                type: Boolean,
                defaultValue: true,
                table: {
                    hidden: true
                }
            },
            ImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            PassengerTags: {
                type: ['PassengerTag'],
                ref: 'PassengerTag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            CreationTime: {
                type: moment,
                hidden: true
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    return window.formatImage(this.ImageUrl, this.Firstname.replace(/ /g, "+"));
                }
            }
        });

        ModelProvider.registerSchema('PassengerTag', 'api/passengertags', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            Passengers: {
                type: ['Passenger'],
                ref: 'Passenger',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            }
        });

        ModelProvider.registerSchema('Booking', 'api/bookings', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            LocalId: {
                type: Number,
                editable: false
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            BookingStatus: {
                type: String,
                enum: ['Cancelled', 'Provisional', 'Confirmed', 'Allocated', 'Completed']
            },
            BookedDateTime: {
                type: moment,
                required: false,
                displayFilters: " | TZConvert | date:'shortDate'",
                table: {
                    visible: false
                }
            },
            DriverOnRouteDateTime: {
                type: moment,
                displayFilters: " | date:'dd/MM/yyyy'",
                table: {
                    visible: false
                }
            },
            DriverArrivedDateTime: {
                type: moment,
                required: false,
                displayFilters: " | date:'dd/MM/yyyy'",
                table: {
                    visible: false
                }
            },
            POBDateTime: {
                type: moment,
                required: false,
                displayFilters: " | date:'dd/MM/yyyy'",
                table: {
                    visible: false
                }
            },
            JobClearDateTime: {
                type: moment,
                required: false,
                displayFilters: " | date:'dd/MM/yyyy'",
                table: {
                    visible: false
                }
            },
            ClientId: {
                type: String,
                required: false,
                displayField: 'Client.Name',
                table: {
                    hidden: true
                }
            },
            Client: {
                type: 'Client',
                ref: 'Client',
                refBy: 'ClientId',
                table: {
                    hidden: true
                }
            },
            BookingSource: {
                type: String
            },
            VehicleClassId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            VehicleTypeId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Pax: {
                type: Number,
                table: {
                    hidden: true
                },
                display: 'Max. Passengers'
            },
            Bax: {
                type: Number,
                table: {
                    hidden: true
                },
                display: 'Max. Baggage'
            },
            AsDirected: {
                type: Boolean,
                table: {
                    hidden: true
                }
            },
            LeadPassengerId: {
                type: String,
                required: false,
                displayField: 'LeadPassenger._Fullname',
                table: {
                    hidden: true
                }
            },
            LeadPassenger: {
                type: 'Passenger',
                ref: 'Passenger',
                refBy: 'LeadPassengerId',
                table: {
                    hidden: true
                }
            },
            DriverShiftId: {
                type: String,
                required: false,
                displayField: 'DriverShift.Id',
                table: {
                    hidden: true
                }
            },
            DriverShift: {
                type: 'DriverShift',
                ref: 'DriverShift',
                refBy: 'DriverShiftId',
                table: {
                    hidden: true
                }
            },
            DriverId: {
                type: String,
                required: false,
                displayField: '_DriverSummary',
                table: {
                    hidden: true
                }
            },
            Driver: {
                type: 'Driver',
                ref: 'Driver',
                refBy: 'DriverId',
                table: {
                    hidden: true
                }
            },
            VehicleId: {
                type: String,
                required: false,
                displayField: '_VehicleSummary',
                table: {
                    hidden: true
                }
            },
            Vehicle: {
                type: 'Vehicle',
                ref: 'Vehicle',
                refBy: 'VehicleId',
                table: {
                    hidden: true
                }
            },
            PartnerId: {
                type: String,
                required: false,
                table: {
                    hidden: true
                }
            },
            EncodedRoute: {
                type: String
            },
            PassengerNotes: {
                type: String,
                table: {
                    visible: false
                }
            },
            DriverNotes: {
                type: String,
                table: {
                    visible: false
                }
            },
            OfficeNotes: {
                type: String,
                table: {
                    visible: false
                }
            },
            JobCron: {
                type: String
            },
            AutoDispatch: {
                type: Boolean,
                table: {
                    visible: false
                }
            },
            EstimatedDistance: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            EstimatedDuration: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            EstimatedCost: {
                type: Number,
                prepend: {
                    text: '{{symbol || current.Prepend}}'
                },
                table: {
                    hidden: true
                },
            },
            ActualCost: {
                type: Number,
                table: {
                    hidden: true
                },
                prepend: {
                    text: '{{symbol || current.Prepend}}'
                },
            },
            DriverCost: {
                type: Number,
                table: {
                    hidden: true
                },
                prepend: {
                    text: '{{symbol || current.Prepend}}'
                },
            },
            InvoiceCost: {
                type: Number,
                table: {
                    hidden: true
                },
                prepend: {
                    text: '{{symbol || current.Prepend}}'
                },
            },
            InvoiceId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Time: {
                type: String,
                inputType: 'time',
                displayField: '_Time',
                table: {
                    hidden: true
                }
            },
            ImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            PricingModelId: {
                type: String
            },
            ChauffeurMode: {
                type: Boolean
            },
            EstimatedMins: {
                type: Number
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    if (this.ImageUrl) {
                        if (this.ImageUrl.slice(0, 4) == 'http') {
                            return this.ImageUrl;
                        } else {
                            return window.resourceEndpoint + this.ImageUrl;
                        }
                    } else {
                        var result = $config.GMAPS_STATIC_URL + "&markers=" +
                            encodeURIComponent("shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-start@2x.png|" + (this._FromCoords || this._FromSummary)) +
                            "&markers=" +
                            encodeURIComponent("shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-finish@2x.png|" + (this._ToCoords || this._ToSummary));
                        //if (this.EncodedRoute) {
                        //  result += "&path=" +
                        //  encodeURIComponent("weight:5|color:0x2dbae4ff|enc:" + encodeURIComponent(this.EncodedRoute));
                        //}

                        return result;
                    }
                }
            },
            _Time: {
                type: String,
                calculated: function () {
                    return new moment(this.Time).format('HH:mm');
                },
                table: {
                    hidden: true
                }
            },
            _LeadPassenger: {
                type: String,
                table: {
                    hidden: true
                }
            },
            _LeadPassengerNumber: {
                type: String,
                table: {
                    hidden: true
                }
            },
            DriverTags: {
                type: ['DriverTag'],
                ref: 'DriverTag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            Passengers: {
                type: ['Passenger'],
                ref: 'Passenger',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            BookingStops: {
                type: ['BookingStop'],
                ref: 'BookingStop',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            VehicleTags: {
                type: ['VehicleTag'],
                ref: 'VehicleTag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            BookingRequirements: {
                type: ['BookingRequirement'],
                ref: 'BookingRequirement',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            _FromCoords: {
                type: String,
                calculated: function () {
                    if (this.BookingStops && this.BookingStops.length) {
                        var model = this.BookingStops[0];
                        if (model.Latitude && model.Longitude) {
                            return model.Latitude + ',' + model.Longitude;
                        }
                    }
                }
            },
            _ToCoords: {
                type: String,
                calculated: function () {
                    if (this.BookingStops && this.BookingStops.length) {
                        var model = this.BookingStops[this.BookingStops.length - 1];
                        if (model.Latitude && model.Longitude) {
                            return model.Latitude + ',' + model.Longitude;
                        }
                    }
                }
            },
            _FromSummary: {
                type: String,
                calculated: function () {
                    if (this.BookingStops && this.BookingStops.length) {
                        var model = this.BookingStops[0];
                        var add = '';
                        if (model.Address1.length > 1) {
                            add += model.Address1;
                        }
                        if (model.TownCity) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += model.TownCity;
                        } else if (model.Area) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += model.Area;
                        }
                        if (model.County && add.length == 0) {
                            add += model.County;
                        }
                        if (model.Postcode) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += model.Postcode;
                        }
                        return add;
                    }
                }
            },
            _ToSummary: {
                type: String,
                calculated: function () {
                    if (this.BookingStops && this.BookingStops.length) {
                        var model = this.BookingStops[this.BookingStops.length - 1];
                        var add = '';
                        if (model.Address1.length > 1) {
                            add += model.Address1;
                        }
                        if (model.TownCity) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += model.TownCity;
                        } else if (model.Area) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += model.Area;
                        }
                        if (model.County && add.length == 0) {
                            add += model.County;
                        }
                        if (model.Postcode) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += model.Postcode;
                        }
                        return add;
                    } else {
                        return 'As Directed';
                    }
                }
            },
            _ClientName: {
                type: String,
                display: 'Client',
                calculated: function () {
                    return (this.Client && this.Client.Name);
                }
            },
            _VehicleReg: {
                type: String,
                display: 'Vehicle',
                calculated: function () {
                    return (this.Vehicle && this.Vehicle.Registration);
                }
            },
            _DriverSummary: {
                type: String,
                display: 'Driver',
                calculated: function () {
                    return (this.Driver && (this.Driver.Firstname + ' ' + this.Driver.Surname + ' (' + this.Driver.Callsign + ')'));
                }
            },
            _VehicleSummary: {
                type: String,
                display: 'Vehicle',
                calculated: function () {
                    return (this.Vehicle && (this.Vehicle.Colour + ' ' + this.Vehicle.Make + ' ' + this.Vehicle.Model + ' (' + this.Vehicle.Registration + ')'));
                }
            },
            _LeadPassengerName: {
                type: String,
                display: 'Lead Passenger',
                calculated: function () {
                    if (this.LeadPassenger)
                        return (this.LeadPassenger.Firstname + ' ' + this.LeadPassenger.Surname);
                }
            },
            _WaitTime: {
                type: Number,
                calculated: function () {
                    var result = 0;
                    if (this.BookingStops) {
                        for (var i = 0; i < this.BookingStops.length; i++) {
                            if (i.WaitTime)
                                result += i.WaitTime;
                        }
                    }
                    return result;
                }
            },
            _WaitTimeCharges: {
                type: Number,
                calculated: function () {
                    var result = 0;
                    if (this.BookingStops) {
                        result = this.BookingStops[0] && this.BookingStops[0].WaitTimeChargable;
                    }
                    return result;
                }
            },
            CurrencyId: {
                type: String
            },
            Currency: {
                type: 'Currency',
                ref: 'Currency',
                refBy: 'CurrencyId'
            },
            CurrencyRate: {
                type: Number
            },
            ChaffuerMode: {
                type: Boolean
            },
            TaxId: {
                type: String,
                display: 'VAT',
                displayField: 'Tax.Name',
                required: true
            },
            Tax: {
                type: 'Tax',
                ref: 'Tax',
                refBy: 'TaxId',
            },
            Discount: {
                type: Number,
                append: {
                    text: '%',
                    click: "discount.type = 'percent';"
                },
                prepend: {
                    text: '{{symbol || current.Prepend}}',
                    click: "discount.type = 'amount';"
                }
            }
        });

        ModelProvider.registerSchema('DriverShift', 'api/drivershifts', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            StartTime: {
                type: moment,
                required: false,
                displayFilters: " | date:'HH:mm'",
                table: {
                    visible: false
                }
            },
            EndTime: {
                type: moment,
                required: false,
                displayFilters: " | date:'HH:mm'",
                table: {
                    visible: false
                }
            },
            DriverId: {
                type: String,
                required: true,
                displayField: 'Driver._Fullname',
                table: {
                    hidden: true
                }
            },
            Driver: {
                type: 'Driver',
                ref: 'Driver',
                refBy: 'DriverId',
                table: {
                    hidden: true
                }
            },
            VehicleId: {
                type: String,
                required: true,
                displayField: 'Vehicle._Description',
                table: {
                    hidden: true
                }
            },
            Vehicle: {
                type: 'Vehicle',
                ref: 'Vehicle',
                refBy: 'VehicleId',
                table: {
                    hidden: true
                }
            },
            BookingRequirements: {
                type: ['BookingRequirement'],
                ref: 'BookingRequirement',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            EncodedRoute: {
                type: String
            }
        });

        ModelProvider.registerSchema('BookingStop', 'api/bookingstops', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            StopSummary: {
                type: String
            },
            Type: {
                type: String,
                enum: ['PickUp', 'Via', 'StopAndWait', 'DropOff']
            },
            StopOrder: {
                type: Number,
                required: false
            },
            WaitTime: {
                type: Number,
                required: false
            },
            WaitTimeChargable: {
                type: Number,
                required: false
            },
            Address1: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Address2: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Area: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            TownCity: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            County: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Postcode: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Country: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            _FullAddress: {
                type: String,
                calculated: function () {
                    var summary = '';
                    summary += this.Address1 ? (this.Address1 + '\n') : '';
                    summary += this.Address2 ? (this.Address2 + '\n') : '';
                    summary += this.Area ? (this.Area + '\n') : '';
                    summary += this.TownCity ? (this.TownCity + '\n') : '';
                    summary += this.Postcode ? (this.Postcode + '\n') : '';
                    summary += this.County ? (this.County + '\n') : '';
                    summary += this.Country ? this.Country : '';
                    return summary;
                },
                display: 'Full Address'
            },
            Latitude: {
                type: Number,
                required: false
            },
            Longitude: {
                type: Number,
                required: false
            },
            latitude: {
                type: Number,
                calculated: function () {
                    return this.Latitude;
                }
            },
            longitude: {
                type: Number,
                calculated: function () {
                    return this.Longitude;
                }
            },
            Note: {
                type: String
            },
            BookingId: {
                type: String,
                required: true,
                displayField: 'Booking.Id',
                table: {
                    hidden: true
                }
            },
            Booking: {
                type: 'Booking',
                ref: 'Booking',
                refBy: 'BookingId',
                table: {
                    hidden: true
                }
            },
            _WaitingTimeCharges: {
                type: Number,
                calculated: function () {
                    if (this.WaitTimeChargable && this.WaitTime)
                        return (this.WaitTimeChargable * this.WaitTime);
                    else
                        return 0;
                }
            }
        });

        ModelProvider.registerSchema('BookingRequirement', 'api/bookingrequirements', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            Description: {
                type: String
            },
            Bookings: {
                type: ['Booking'],
                ref: 'Booking',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            DriverShifts: {
                type: ['DriverShift'],
                ref: 'DriverShift',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            }
        });

        ModelProvider.registerSchema('ChangePassword', '', {
            UserName: {
                type: String,
                required: true
            },
            CurrentPassword: {
                type: String,
                required: true,
                inputType: 'password'
            },
            NewPassword: {
                type: String,
                required: true,
                inputType: 'password'
            },
            NewPasswordRepeat: {
                type: String,
                required: true,
                inputType: 'password'
            }
        });

        ModelProvider.registerSchema('User', 'api/account', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            UserName: {
                type: String
            },
            Email: {
                type: String
            },
            Claims: {
                type: ['Claim'],
                ref: 'Claim',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            AccessFailedCount: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            LockoutEnabled: {
                type: Boolean,
                table: {
                    visible: false
                }
            },
            LockoutEndDateUtc: {
                type: moment,
                table: {
                    hidden: true
                }
            },
            PhoneNumber: {
                type: String
            },
            UserType: {
                type: String,
                calculated: function () {
                    var type = "";
                    for (var i = 0; i < this.Claims.length; i++) {
                        if (this.Claims[i].ClaimType == 'DriverId') {
                            type += 'Driver ';
                        } else if (this.Claims[i].ClaimType == 'ClientId') {
                            type += 'Client '
                        } else if (this.Claims[i].ClaimType == 'PassengerId') {
                            type += 'Passenger '
                        } else if (this.Claims[i].ClaimType == 'StaffId') {
                            type += 'Staff '
                        }
                    }
                    return type;
                },
                display: 'User Type'
            }
        });

        ModelProvider.registerSchema('Claim', '', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            ClaimType: {
                type: String
            },
            ClaimValue: {
                type: String
            },
            UserId: {
                type: String
            }
        });

        ModelProvider.registerSchema('Currency', 'api/Currencies', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
            },
            Short: {
                type: String,
            },
            Prepend: {
                type: String
            },
            Append: {
                type: String
            },
            CurrentRate: {
                type: Number
            }
        });


        ModelProvider.registerSchema('Tax', 'api/taxes', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            TaxTypeId: {
                type: String,
                display: 'Tax Type',
                displayField: 'TaxType.Name',
                table: {
                    hidden: true
                }
            },
            TaxType: {
                type: 'TaxType',
                ref: 'TaxType',
                refBy: 'TaxTypeId',
                table: {
                    hidden: true
                }
            },
            _TaxType: {
                type: String,
                calculated: function () {
                    return (this.TaxType) ? this.TaxType.Name : '';
                },
                display: 'Tax Type'
            },
            Description: {
                type: String,
                table: {
                    visible: false
                }
            },
            TaxComponents: {
                type: ['TaxComponent'],
                ref: 'TaxComponent',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            _TaxRate: {
                type: String,
                display: 'Rate',
                calculated: function () {
                    var result = 0;
                    if (this.TaxComponents) {
                        for (var i = 0; i < this.TaxComponents.length; i++) {
                            result = result + this.TaxComponents[i].Rate;
                        }
                    }
                    return result + '%';
                }
            },
            _TaxAmount: {
                type: Number,
                table: {
                    hidden: true
                },
                calculated: function () {
                    var result = 0;
                    if (this.TaxComponents) {
                        for (var i = 0; i < this.TaxComponents.length; i++) {
                            result = result + (this.TaxComponents[i].Rate / 100);
                        }
                    }
                    return result;
                }
            }
        });

        ModelProvider.registerSchema('TaxType', 'api/TaxTypes', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
            },
            Description: {
                type: String
            }
        });

        ModelProvider.registerSchema('TaxComponent', 'api/TaxComponents', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                table: {
                    visible: false
                },
                display: 'Component'
            },
            TaxId: {
                type: String,
                display: 'Tax',
                displayField: 'Tax.Name',
                table: {
                    hidden: true
                }
            },
            Tax: {
                type: 'Tax',
                ref: 'Tax',
                refBy: 'TaxId',
                table: {
                    hidden: true
                }
            },
            Rate: {
                type: Number
            },
            Description: {
                type: String,
                table: {
                    visible: false
                }
            }
        });

        ModelProvider.registerSchema('Invoice', 'api/invoice', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            InvoiceType: {
                type: String,
                table: {
                    visible: false
                }
            },
            Reference: {
                type: String
            },
            ClientId: {
                type: String,
                displayField: 'Client.Name',
                table: {
                    hidden: true
                },
                display: 'Client'
            },
            Client: {
                type: 'Client',
                ref: 'Client',
                refBy: 'ClientId',
                table: {
                    hidden: true
                }
            },
            _Client: {
                type: String,
                calculated: function () {
                    return this.Client ? this.Client.Name : '';
                },
                display: 'Client'
            },
            DriverId: {
                type: String,
                displayField: 'Driver._Fullname',
                table: {
                    hidden: true
                }
            },
            Driver: {
                type: 'Driver',
                ref: 'Driver',
                refBy: 'DriverId',
                table: {
                    hidden: true
                }
            },
            Discount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            Notes: {
                type: String,
                table: {
                    visible: false
                }
            },
            SubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            TaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            CreationTime: {
                type: moment,
                display: 'Creation Date',
                displayFilters: " | TZConvert | date:'shortDate'"
            },
            DueDate: {
                type: moment,
                display: 'Due Date',
                required: true,
                displayFilters: " | TZConvert | date:'shortDate'"
            },
            Bookings: {
                type: ['Booking'],
                ref: 'Booking',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            NoOfBookings: {
                type: Number,
                display: 'Bookings'
            },
            Status: {
                type: String,
                enum: ['Unsent', 'Unpaid', 'Paid']
            },
            TotalAmount: {
                type: Number,
                display: 'Amount Due',
                binding: function (item) {
                    return currencyIcon + item.TotalAmount.toFixed(2);
                }
            },
            PaymentInstructions: {
                type: String,
                textarea: 4,
                display: 'Payment Instructions'
            }
        });

    }

    runFn.$inject = ['AUTH_EVENTS', 'SignalR', "$rootScope", "Logger", '$modal', 'Model', '$timeout', '$state', 'LookupCache', '$config', '$localStorage', 'Auth', 'ViewerCache', 'Localisation', 'tmhDynamicLocale'];

    function runFn(AUTH_EVENTS, SignalR, $rootScope, Logger, $modal, Model, $timeout, $state, LookupCache, $config, $localStorage, Auth, ViewerCache, Localisation, tmhDynamicLocale) {
        var logger = Logger.createLogger('APP RUN');
        $rootScope.COMPANY = {};
        $rootScope.DRIVERID = null;
        _setupRouteChangeEvents();
        $rootScope.API_ENDPOINT = $config.API_ENDPOINT;

        function _setupRouteChangeEvents() {
            var logger = Logger.createLogger('ROUTER');
            var currencyObj = Localisation.currency();
            var currencies = currencyObj.currencies();
            var routeChangeAnimControl = null;

            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                if (event.defaultPrevented) return;
                logger.debug('$stateChangeStart triggered');
                routeChangeAnimControl = $timeout(function () {
                    $rootScope.loading = true;
                }, 500)
            });

            $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
                logger.warning('$stateNotFound triggered');
                $state.go('root');
                $rootScope.loading = false;
            });

            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                logger.debug('$stateChangeSuccess triggered');
                if (routeChangeAnimControl) {
                    $timeout.cancel(routeChangeAnimControl);
                    routeChangeAnimControl = null;
                }
                $rootScope.loading = false;
            });

            $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
                logger.warning('$stateChangeError triggered');
                logger.debug('Route Error: Redirecting to Dashboard');
                logger.debug(error);
                $state.go('root.bookings');
            });

            $rootScope.$on('$viewContentLoading', function (event, viewConfig, name) {
                logger.debug('$viewContentLoading triggered');
            });

            $rootScope.$on('$viewContentLoaded', function (event, name, el) {
                logger.debug('$viewContentLoaded triggered');
            });
            if ($localStorage.AUTH_TKN) {
                SignalR.setQueryValue('token', $localStorage.AUTH_TKN.access_token);
                _setupLookupCache();
                _setupViewerCache();
                Model.Company
                    .query()
                    .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                    .execute().then(function (c) {
                        $rootScope.COMPANY = c[0];
                        //Localisation set functions
                        currencies.then(function (res) {
                            currencyObj.setCurrent(c[0].DefaultCurrencyId);
                            currencyIcon = currencyObj.getCurrent().Prepend;
                        });
                        if (c[0].DefaultLocale)
                            tmhDynamicLocale.set(c[0].DefaultLocale);
                        else
                            tmhDynamicLocale.set($config.DEFAULT_LOCALE);

                        if (c[0].DefaultTimezone) {
                            moment.tz.setDefault(c[0].DefaultTimezone);
                            Localisation.timeZone().setTimeZone(c[0].DefaultTimezone);
                        }
                        Localisation.useMetric(c[0].UseMetric);
                    });
                if (Auth.getSession().Claims.DriverId && Auth.getSession().Claims.DriverId[0]) {
                    $rootScope.DRIVERID = Auth.getSession().Claims.DriverId[0];
                }
            }
            $rootScope.$on(AUTH_EVENTS.LOGIN_SUCCESS, function (event, currentSession) {
                SignalR.setQueryValue('token', currentSession.access_token);
                _setupLookupCache();
                _setupViewerCache();
                Model.Company
                    .query()
                    .filter("Id eq guid'" + currentSession.TenantId + "'")
                    .execute().then(function (c) {
                        $rootScope.COMPANY = c[0];
                    });
            });

            SignalR.start().then(function () {
                logger.info('SignalR Started');
            });
        }

        function _setupLookupCache() {
            Model.DriverType
                .query()
                .execute()
                .then(function (data) {
                    LookupCache.DriverType = data;
                    LookupCache.DriverType.$updated = new moment();
                });

            Model.VehicleType
                .query()
                .execute()
                .then(function (data) {
                    LookupCache.VehicleType = data;
                    LookupCache.VehicleType.$updated = new moment();
                });

            Model.VehicleClass
                .query()
                .execute()
                .then(function (data) {
                    LookupCache.VehicleClass = data;
                    LookupCache.VehicleClass.$updated = new moment();
                });

            Model.ClientType
                .query()
                .execute()
                .then(function (data) {
                    LookupCache.ClientType = data;
                    LookupCache.ClientType.$updated = new moment();
                });
        }

        function _setupViewerCache() {
            //ViewerCache
            Model.Driver
                .query()
                .select('Id,Firstname,Surname')
                .parseAs(function (i) {
                    this.Id = i.Id;
                    this.Name = i.Firstname + ' ' + i.Surname;
                })
                .execute()
                .then(function (data) {
                    ViewerCache.Driver = data;
                });

            Model.Client
                .query()
                .select('Id,Name')
                .execute()
                .then(function (data) {
                    ViewerCache.Client = data;
                });

            Model.Passenger
                .query()
                .select('Id,Firstname,Surname')
                .parseAs(function (i) {
                    this.Id = i.Id;
                    this.Name = i.Firstname + ' ' + i.Surname;
                })
                .execute()
                .then(function (data) {
                    ViewerCache.Passenger = data;
                });

            Model.Vehicle
                .query()
                .select('Id,Registration')
                .parseAs(function (i) {
                    this.Id = i.Id;
                    this.Name = i.Registration;
                })
                .execute()
                .then(function (data) {
                    ViewerCache.Vehicle = data;
                });
        }
    }
}(window, angular));