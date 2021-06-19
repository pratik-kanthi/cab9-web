(function (window, angular) {

    var currencyIcon = '£';

    var app = angular.module("cab9.passenger", [
        "cab9.common",
        "cab9.passenger.dashboard",
        "cab9.passenger.bookings",
        "cab9.passenger.profile",
        "rzModule"
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
            lighterGrey: 'rgba(0,0,0,0.2)'
        }
    });


    configFn.$inject = ['$config', '$sceProvider', '$stateProvider', '$urlRouterProvider', '$compileProvider', 'MenuServiceProvider', 'LoggerProvider', 'ModelProvider', 'datepickerConfig', 'SignalRProvider', 'NotificationProvider'];

    function configFn($config, $sceProvider, $stateProvider, $urlRouterProvider, $compileProvider, MenuServiceProvider, LoggerProvider, ModelProvider, datepickerConfig, SignalRProvider, NotificationProvider) {
        //AuthProvider.setTokenEndpoint($config.API_ENDPOINT + 'token');
        $sceProvider.enabled(false);
        SignalRProvider.setEndpoint($config.API_ENDPOINT + 'signalr/hubs');
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
        SignalRProvider.registerEvent('updateBookingStatus');
        SignalRProvider.registerEvent('updateBookingOffer');
        SignalRProvider.registerEvent('updateBooking');

        datepickerConfig.showWeeks = false;
        datepickerConfig.showButtonBar = false;
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
    }

    runFn.$inject = ['AUTH_EVENTS', 'SignalR', "$rootScope", "Logger", '$modal', 'Model', '$timeout', '$state', 'LookupCache', '$config', '$localStorage', 'Auth', 'ViewerCache', '$http', 'Localisation', 'tmhDynamicLocale'];

    function runFn(AUTH_EVENTS, SignalR, $rootScope, Logger, $modal, Model, $timeout, $state, LookupCache, $config, $localStorage, Auth, ViewerCache, $http, Localisation, tmhDynamicLocale) {
        var logger = Logger.createLogger('APP RUN');
        $rootScope.COMPANY = {};
        $rootScope.PASSENGERID = null;
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

            if ($localStorage.AUTH_TKN) {
                SignalR.setQueryValue('token', $localStorage.AUTH_TKN.access_token);
                _setupLookupCache();
                _setupViewerCache();
                Model.Company
                    .query()
                    .include('DefaultDriverPaymentModel')
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
                if (Auth.getSession().Claims.PassengerId && Auth.getSession().Claims.PassengerId[0]) {
                    $rootScope.PASSENGERID = Auth.getSession().Claims.PassengerId[0];
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
}(window, angular));