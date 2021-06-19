(function(window, angular) {
    var permissionsFix = angular.module('cab9.permissions', ["ui.router"]);

    permissionsFix.constant('$permissions', {
        role: null,
        permissions: [],
        cardPaymentsActive: false,
        test: function(name, right) {
            var result = false;
            if (right == undefined)
                right = 'R';

            var perm = this.permissions.filter(function(p) {
                return (p.hasOwnProperty(name))
            })[0];
            var index = this.permissions.indexOf(perm);
            if (index != -1)
                result = this.permissions[index][name][right];
            return this.permissions.indexOf('superadmin') != -1 || result;
        }
    });

    permissionsFix.config(['$permissions', function($permissions) {
        $permissions.role = window.$$permissions;
        $permissions.permissions = JSON.parse(window.$$permissions.Permissions);
        $permissions.cardPaymentsActive = window.$$permissions.cardPaymentsActive;
    }]);

    permissionsFix.run(['$rootScope', '$permissions', '$http', function($rootScope, $permissions, $http) {
        if($permissions.cardPaymentsActive ==true) {
            $rootScope.CARD_PAYMENTS_ENABLED = true;
        }
        $rootScope.PERMISSIONS = $permissions;
    }]);
    var currencyIcon = '£';

    var app = angular.module("cab9.client", [
        // "cab9.logFix",
        "cab9.permissions",
        "cab9.common",
        "cab9.client.dashboard",
        "cab9.client.bookings",
        "cab9.client.staff",
        "cab9.client.passengers",
        "cab9.client.locations",
        "cab9.client.invoices",
        "cab9.client.report",
        "cab9.client.settings",
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
        SignalRProvider.registerEvent('newMessage');
        SignalRProvider.registerEvent('newExpenseNotification');


        datepickerConfig.showWeeks = false;
        datepickerConfig.showButtonBar = false;
        LoggerProvider.setGlobalLoggingLevel(5);
        LoggerProvider.addProvider('ConsoleLoggingProvider');
        LoggerProvider.hideCatagory('APP RUN');
        $urlRouterProvider.otherwise('/');
        $urlRouterProvider.when('', '/');
        $stateProvider.state('root', {
            abstract: true,
            onEnter: function() {
                setTimeout(function() {
                    jQuery('.animation-root').removeClass('animation-root');
                }, 1000);
            },
            views: {
                'layout': {
                    templateUrl: '/e9_components/layouts/structure/page.layout.html'
                },
                'sidebar-left@root': {
                    templateUrl: '/webapp/client/layout/sidebar-left/sidebar-left.partial.html',
                    controller: 'ClientSidebarController'
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
        $rootScope.CLIENT = {};

        $rootScope.CLIENTID = null;
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

        //if (Auth.getSession().Claims.TenantId[0] == '50f56597-c049-e611-80c7-14187728d133') {
        //    $rootScope.isAlert = true;
        //}
        var x = Auth.getSession().Claims;
        if (!Auth.getSession().Claims.SkipDisclaimer && !sessionStorage.getItem('SkipDisclaimer')) {
            $modal.open({
                templateUrl: '/webapp/client/disclaimer.modal.html',
                controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                    $scope.doNotShow = false;
                    $scope.confirm = confirm;

                    function confirm() {
                        if ($scope.doNotShow) {
                            $http.post($config.API_ENDPOINT + 'api/Account/DoNotShowDisclaimer', null).success(function() {
                                var session = Auth.getSession();
                                session.Claims.SkipDisclaimer = true;
                                var formatted = angular.toJson(session);
                                localStorage.setItem('AUTH_TKN', formatted);
                            })
                        }
                        sessionStorage.setItem('SkipDisclaimer', true);
                        $modalInstance.close();
                    }
                }]
            });
        }

        function _setupRouteChangeEvents() {
            var logger = Logger.createLogger('ROUTER');
            var currencyObj = Localisation.currency();
            var currencies = currencyObj.currencies();
            var routeChangeAnimControl = null;

            $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
                if (event.defaultPrevented) return;
                logger.debug('$stateChangeStart triggered');
                routeChangeAnimControl = $timeout(function() {
                    $rootScope.loading = true;
                }, 500)
            });

            $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
                logger.warning('$stateNotFound triggered');
                $state.go('root');
                $rootScope.loading = false;
            });

            $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
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

            $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
                logger.warning('$stateChangeError triggered');
                logger.debug('Route Error: Redirecting to Dashboard');
                logger.debug(error);
                $state.go('root');
            });

            $rootScope.$on('$viewContentLoading', function(event, viewConfig, name) {
                logger.debug('$viewContentLoading triggered');
            });

            $rootScope.$on('$viewContentLoaded', function(event, name, el) {
                logger.debug('$viewContentLoaded triggered');
                $('html,body').animate({
                    scrollTop: 0
                }, 0, function() {});
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
                _setupViewerCache();


                Model.Company
                    .query()
                    .include('DefaultDriverPaymentModel')
                    .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                    .execute().then(function(c) {
                        $rootScope.COMPANY = c[0];

                        //Localisation set functions
                        currencies.then(function(res) {
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

                if (Auth.getSession().Claims.ClientId && Auth.getSession().Claims.ClientId[0]) {
                    $rootScope.CLIENTID = Auth.getSession().Claims.ClientId[0];
                } else {
                    $rootScope.$broadcast(AUTH_EVENTS.LOGOUT);
                }

                Model.Client.query().filter("Id eq guid'" + $rootScope.CLIENTID + "'").select('ShowPriceInPortal,AllowCashInPortal,ShowVATInPortal').parseAs(angular.identity).execute().then(function(c) {
                    $rootScope.CLIENT = c[0];
                })
            }
            $rootScope.$on(AUTH_EVENTS.LOGIN_SUCCESS, function(event, currentSession) {
                SignalR.setQueryValue('token', currentSession.access_token);
                _setupLookupCache();
                _setupViewerCache();
                Model.Company
                    .query()
                    .filter("Id eq guid'" + currentSession.TenantId + "'")
                    .execute().then(function(c) {
                        $rootScope.COMPANY = c[0];
                    });
            });


            SignalR.start().then(function() {
                logger.info('SignalR Started');
            });
        }

        function _setupLookupCache() {}

        function _setupViewerCache() {}
    }
}(window, angular));