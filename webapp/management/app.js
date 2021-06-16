(function (window, angular) {
    // var logfix = angular.module('cab9.logFix', []);
    // logfix.config(['$provide', function ($provide) {
    //     $provide.decorator('$log', ['$delegate', function ($delegate) {
    //         $delegate.error = angular.noop;
    //         $delegate.warn = angular.noop;
    //         $delegate.info = angular.noop;
    //         $delegate.log = angular.noop;
    //         $delegate.debug = angular.noop;
    //         return $delegate;
    //     }]);
    // }]);

    var permissionsFix = angular.module('cab9.permissions', ["ui.router"]);

    permissionsFix.constant('$permissions', {
        role: null,
        permissions: [],
        test: function (name, right) {
            var result = false;
            if (right == undefined)
                right = 'R';
            var perm = this.permissions.filter(function (p) {
                return (p.hasOwnProperty(name))
            })[0];
            var index = this.permissions.indexOf(perm);
            if (index != -1)
                result = this.permissions[index][name][right];
            return this.permissions.indexOf('superadmin') != -1 || result;
        }
    });

    permissionsFix.config(['$permissions', function ($permissions) {
        $permissions.role = window.$$permissions;
        $permissions.permissions = JSON.parse(window.$$permissions.Permissions);
    }])
    permissionsFix.run(['$rootScope', '$permissions', function ($rootScope, $permissions) {
        $rootScope.PERMISSIONS = $permissions;
    }]);
    var currencyIcon = '£';

    var app = angular.module("cab9", [
        "cab9.permissions",
        "cab9.common",
        "cab9.dashboard",
        "cab9.dispatch",
        "cab9.bookings",
        "cab9.clients",
        "cab9.drivers",
        "cab9.vehicles",
        "cab9.staff",
        "cab9.passengers",
        "cab9.invoices",
        "cab9.driverpayments",
        "cab9.report",
        //"cab9.conversations",
        "cab9.settings",
        "cab9.settings.exports",
        "cab9.settings.import",
        //cab9.utilities",
        "cab9.workshare",
        "rzModule",
        "color.picker"
    ]);

    app.config(configFn);
    app.run(runFn);

    app.constant('$UI', {
        COLOURS: {
            brandPrimary: '#455674',
            brandSecondary: '#A88ADC',
            menuLight: '#2B303B',
            menuDark: '#21252D',
            blue: '#008FFB',
            red: '#F55753',
            orange: '#e67e22',
            yellow: '#F8D053',
            cyan: '#10CFBD',
            sky: '#48B0F7',
            green: '#64c458',
            purple: '#6D5CAE',
            brandGrey: '#3B4752',
            darkGrey: '#2B303B',
            lightGrey: 'rgba(100,100,100,0.1)',
            grey: '#788195',
            lighterGrey: 'rgba(0,0,0,0.2)',
            light: '#EFEFEF',
            dark: '#111111',
            grey: '#999999'
        }
    });


    configFn.$inject = ['$config', '$sceProvider', '$stateProvider', '$urlRouterProvider', '$compileProvider', 'MenuServiceProvider', 'LoggerProvider', 'ModelProvider', 'datepickerConfig', 'SignalRProvider', '$permissions', 'NotificationProvider', 'ipnConfig', '$provide'];

    function configFn($config, $sceProvider, $stateProvider, $urlRouterProvider, $compileProvider, MenuServiceProvider, LoggerProvider, ModelProvider, datepickerConfig, SignalRProvider, $permissions, NotificationProvider, ipnConfig, $provide) {
        //AuthProvider.setTokenEndpoint($config.API_ENDPOINT + 'token');

        ipnConfig.nationalMode = true;
        ipnConfig.defaultCountry = "gb";



        $sceProvider.enabled(false);
        SignalRProvider.setEndpoint($config.SIGNALR_ENDPOINT + 'signalr/hubs');
        SignalRProvider.setHub('locationHub');
        if ((item = localStorage.getItem('AUTH_TKN'))) {
            try {
                var parsed = angular.fromJson(item);
                SignalRProvider.setQueryValue('token', parsed.access_token);

            } catch (e) {
                console.log(e);
            }
        }
        SignalRProvider.registerEvent('updateDriverLocation');
        SignalRProvider.registerEvent('updateDriverStatus');
        SignalRProvider.registerEvent('updateDriverShifts');
        SignalRProvider.registerEvent('updatePartnerDriverLocations');
        SignalRProvider.registerEvent('updateBookingStatus');
        SignalRProvider.registerEvent('updateBookingOffer');
        SignalRProvider.registerEvent('updateBooking');
        SignalRProvider.registerEvent('newMessage');
        SignalRProvider.registerEvent('sendDriverETA');
        SignalRProvider.registerEvent('bookingResponded');
        SignalRProvider.registerEvent('updatePaymentGeneration');
        SignalRProvider.registerEvent('updateInvoiceGeneration');
        SignalRProvider.registerEvent('updateInvoiceStatus');
        SignalRProvider.registerEvent('dispatchRecommendations');
        SignalRProvider.registerEvent('dispatchWarnings');
        SignalRProvider.registerEvent('newExpenseNotification');
        SignalRProvider.registerEvent('approvedExpenseNotification');
        SignalRProvider.registerEvent('declinedExpenseNotification');
        SignalRProvider.registerEvent('deletedExpenseNotification');
        SignalRProvider.registerEvent('bookingDriverAck');
        SignalRProvider.registerEvent('ringing');
        SignalRProvider.registerEvent('hungUp');
        SignalRProvider.registerEvent('answered');

        datepickerConfig.showWeeks = false;
        datepickerConfig.showButtonBar = false;

        $provide.decorator('ColorPickerOptions', ['$delegate', function ($delegate) {
            var options = angular.copy($delegate);
            options.round = false;
            options.alpha = false;
            options.format = 'hexString';
            options.restrictToFormat = true;
            return options;
        }]);

        LoggerProvider.setGlobalLoggingLevel(5);
        LoggerProvider.addProvider('ConsoleLoggingProvider');
        LoggerProvider.hideCatagory('APP RUN');
        $urlRouterProvider.otherwise('/');
        $urlRouterProvider.when('', '/');

        $stateProvider.state('root', {
            abstract: true,
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
                'quick-nav@root': {
                    templateUrl: '/webapp/layout/quick-nav/quick-nav.partial.html',
                    controller: 'QuickNavController'
                },
                'topbar@root': {
                    templateUrl: '/webapp/layout/topbar/topbar.partial.html',
                    controller: 'TopBarController'
                },
                'sidebar-right@root': {
                    templateUrl: '/webapp/layout/sidebar-right/sidebar-right.partial.html'
                }
            },
            resolve: {
                rColumns: function () {
                    return null;
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
    }

    runFn.$inject = ['AUTH_EVENTS', 'SignalR', "$rootScope", "Logger", '$modal', 'Model', '$timeout', '$state', 'LookupCache', '$config', '$localStorage', 'Auth', 'ViewerCache', '$http', '$permissions', 'Localisation', 'tmhDynamicLocale'];

    function runFn(AUTH_EVENTS, SignalR, $rootScope, Logger, $modal, Model, $timeout, $state, LookupCache, $config, $localStorage, Auth, ViewerCache, $http, $permissions, Localisation, tmhDynamicLocale) {
        var logger = Logger.createLogger('APP RUN');
        $rootScope.$$p = $permissions;
        $rootScope.COMPANY = {};
        $rootScope.quickNavAvailable = true;
        $rootScope.filters = {
            From: null,
            To: null,
            DriverIds: [],
            ClientIds: [],
            PassengerIds: [],
            VehicleTypeIds: [],
            VehicleClassIds: [],
            CurrencyIds: [],
            PaymentMethods: null,
            BookingSources: null,
            PeriodLength: ""
        }

        _setupRouteChangeEvents();
        $rootScope.API_ENDPOINT = $config.API_ENDPOINT;
        $rootScope.RESOURCE_ENDPOINT = $config.RESOURCE_ENDPOINT;
        if (Auth.getSession().Claims && Auth.getSession().Claims.StaffId)
            $rootScope.STAFF_ID = Auth.getSession().Claims.StaffId[0];

        $rootScope.formatImage = function (url, text) {
            if (url) {
                if (url.slice(0, 4) == 'http') {
                    return url;
                } else if (url.slice(0, 4) == 'api/') {
                    return window.endpoint + url;
                } else {
                    return window.resourceEndpoint + url
                }
            } else {
                return window.endpoint + 'api/imagegen?text=' + text;
            }
        }

        //if (Auth.getSession().Claims.TenantId[0] == '50f56597-c049-e611-80c7-14187728d133') {
        //    $rootScope.isAlert = true;
        //}

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
                // reset the currentCurrency obj if currency is changed in Bookings page

                if (currencyObj.getCurrent() && $rootScope.COMPANY) {
                    //console.log(currencyObj.getCurrent().Prepend);
                    if (currencyObj.getCurrent().Id != $rootScope.COMPANY.DefaultCurrencyId)
                        currencyObj.setCurrent($rootScope.COMPANY.DefaultCurrencyId);
                }
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
                console.log(error);
                $state.go('root');
            });

            $rootScope.$on('$viewContentLoading', function (event, viewConfig, name) {
                logger.debug('$viewContentLoading triggered');
            });

            $rootScope.$on('$viewContentLoaded', function (event, name, el) {
                logger.debug('$viewContentLoaded triggered');
                $('html,body').animate({
                    scrollTop: 0
                }, 0, function () {});
            });

            $http.get($config.API_ENDPOINT + 'api/payments/ispaymentenabled').then(function (response) {
                if (response.data.CreditCardPaymentsActive == true) {
                    $config.CARD_PAYMENTS_ENABLED = true;
                    $rootScope.CARD_PAYMENTS_ENABLED = true;
                }
            });

            if ($localStorage.AUTH_TKN) {
                SignalR.setQueryValue('token', $localStorage.AUTH_TKN.access_token);
                _setupLookupCache();
                // _setupViewerCache();
                Model.Company
                    .query()
                    .include('DefaultDriverPaymentModel')
                    .include('DefaultTax')
                    .include('DefaultTax/TaxComponents')
                    .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                    .execute().then(function (c) {
                        $rootScope.COMPANY = c[0];
                        $rootScope.COMPANY.$defaultTaxRate = $rootScope.COMPANY.DefaultTax.TaxComponents.reduce(function (prev, current) {
                            return prev + (current.Rate / 100);
                        }, 0);

                        $rootScope.COMPANY.EnableBidding = false;
                        $rootScope.COMPANY.EnableAuctionBidding = false;

                        $http.get($config.API_ENDPOINT + 'api/Bid/companybiddingdetails').then(function (response) {

                            if (response.data) {
                                $rootScope.COMPANY.EnableBidding = (response.data.EnableBidding) ? response.data.EnableBidding : false;
                                $rootScope.COMPANY.EnableAuctionBidding = (response.data.EnableAuctionBidding) ? response.data.EnableAuctionBidding : false;
                            }
                        });

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
                $rootScope.EXPIRES = $localStorage.AUTH_TKN['.expires'];
                $rootScope.EXPIRING_SOON = function () {
                    return new moment().isAfter(new moment(new Date($localStorage.AUTH_TKN['.expires'])).subtract(20, 'minutes'));
                }
            }
            $rootScope.$on(AUTH_EVENTS.LOGIN_SUCCESS, function (event, currentSession) {
                SignalR.setQueryValue('token', currentSession.access_token);
                _setupLookupCache();
                // _setupViewerCache();
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
                    LookupCache.VehicleType = data.sort(function (a, b) {
                        return (a.Priority || 99) - (b.Priority || 99);
                    });
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

            Model.Staff
                .query()
                .select('Id,Firstname,Surname')
                .parseAs(function (i) {
                    this.Id = i.Id;
                    this.Name = i.Firstname + ' ' + i.Surname;
                })
                .execute()
                .then(function (data) {
                    ViewerCache.Staff = data;
                });
        }
    }

    //config module used in react disaptach
    var configModule = angular.module('cab9.config', []);
    configModule.constant('$config', window.$config);
}(window, angular));