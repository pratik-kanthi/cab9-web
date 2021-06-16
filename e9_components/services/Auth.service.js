(function(window, angular) {
    var app = angular.module("framework.services.auth", []);

    app.config(AuthConfig)
    app.run(AuthRun)
    app.controller('AuthLoginController', AuthLoginController);
    app.provider('Auth', AuthServiceProvider);
    app.factory('AuthHttpInterceptor', AuthHttpInterceptor);
    app.factory('AuthRequestBuffer', AuthRequestBuffer);

    app.constant('AUTH_EVENTS', {
        LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
        LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
        LOGIN_EXPIRED: 'AUTH_LOGIN_EXPIRED',
        LOGIN_REFRESHED: 'AUTH_LOGIN_REFRESHED',
        LOGIN_REFRESH: 'LOGIN_REFRESH',
        LOGIN_REQUIRED: 'AUTH_LOGIN_REQUIRED',
        LOGOUT: 'LOGOUT',
        FORBIDDEN: 'AUTH_FORBIDDEN'
    });

    AuthConfig.$inject = ['$stateProvider', '$httpProvider'];

    function AuthConfig($stateProvider, $httpProvider) {
        $stateProvider.state('login', {
            url: '/login?redirect?params',
            views: {
                'layout': {
                    templateUrl: '/e9_components/services/login.partial.html',
                    controller: 'AuthLoginController'
                },
            }
        });

        $httpProvider.interceptors.push('AuthHttpInterceptor');
    }

    AuthRun.$inject = ["$rootScope", "Logger", '$http', 'Auth', '$state', 'AUTH_EVENTS', 'AuthRequestBuffer', '$config'];

    function AuthRun($rootScope, Logger, $http, Auth, $state, AUTH_EVENTS, AuthRequestBuffer, $config) {
        var logger = Logger.createLogger('Auth Module');

        $rootScope.$on(AUTH_EVENTS.LOGIN_REQUIRED, function() {
            //$state.go('login', { redirect: $state.current.name, params: encodeURIComponent(JSON.stringify($state.params)) });
            location.href = $config.LOGIN_URL;
        });

        $rootScope.$on(AUTH_EVENTS.LOGOUT, function() {
            //$state.go('login');
            location.href = $config.LOGIN_URL;
        });

        $rootScope.$on(AUTH_EVENTS.LOGIN_SUCCESS, function(event) {
            AuthRequestBuffer.retryAll();
        });

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            if (toState.name == 'login') return;
            if (angular.isDefined(toState.permissions) || !angular.isDefined(toState.allowAnonymous) || !toState.allowAnonymous) {
                var user = Auth.getSession();
                if (user == null) {
                    event.preventDefault();
                    logger.debug('Redirecting to login page now');
                    //$state.go('login', { redirect: toState.name, params: encodeURIComponent(JSON.stringify(toParams)) });
                    //$state.go('login');
                    location.href = $config.LOGIN_URL;
                    return;
                }
                //$modal.open({
                //  template: '<div class="modal-header"><h3 class="modal-title">Permissions Error</h3></div><img src="http://findicons.com/files/icons/1684/ravenna/128/error.png"/><div class="modal-body">No Permission.</div>'
                //}).result.then(function (result) {
                //  //proceed.
                //});
                //return;
            }
            if (angular.isDefined(toState.permissions)) {
                var user = Auth.getSession();
                if (user && user.Claims && user.Claims.Permissions) {
                    var allow = false;
                    for (var i = 0; i < toState.permissions.length; i++) {
                        var required = toState.permissions[i];
                        for (var j = 0; j < user.Claims.Permissions.length; j++) {
                            var has = user.Claims.Permissions[j];
                            if (has == required) {
                                allow = true;
                                break;
                            }
                        }
                        if (allow) break;
                    }
                    if (!allow) {
                        event.preventDefault();
                        //display alert that not allowed and offer to cancel or login is as another user.
                        logger.debug('Redirecting to login page');
                        //$state.go('login', { redirect: toState.name, params: encodeURIComponent(JSON.stringify(toParams)) });
                        //$state.go('login');
                        location.href = $config.LOGIN_URL;
                    }
                }
            }
        });
    };

    AuthLoginController.$inject = ['$scope', 'Auth', '$state', '$stateParams', 'AuthRequestBuffer'];

    function AuthLoginController($scope, Auth, $state, $stateParams, AuthRequestBuffer) {
        $scope.login = login;
        $scope.loginFailed = false;
        //AuthRequestBuffer.rejectAll();

        function login(username, password) {
            $scope.loginFailed = false;
            $('.login-box').removeClass('animated shake');
            Auth.login(username, password).then(loginSuccess, loginFailed);
        }

        function loginSuccess() {
            //$state.go(($stateParams.redirect && $stateParams.redirect.indexOf('login') != -1) ? $stateParams.redirect : 'root.dashboard', ($stateParams.params) ? JSON.parse(decodeURIComponent($stateParams.params)) : undefined);
            $state.go('root.bookings');
        }

        function loginFailed(reason) {
            $('.login-box').addClass('animated shake');
            $scope.loginFailed = true;
        }
    };

    function AuthServiceProvider() {
        var currentSession = null;

        var provider = {
            tokenEndpoint: '/token',
            refreshEndpoint: '/refresh',
            setSession: setSession,
            setTokenEndpoint: setTokenEndpoint,
            $get: ['$http', '$q', '$timeout', '$rootScope', 'AUTH_EVENTS', getService]
        };

        function setSession(session) {
            currentSession = session;
        }

        function setTokenEndpoint(endpoint) {
            provider.tokenEndpoint = endpoint;
        }

        return provider;

        function getService($http, $q, $timeout, $rootScope, AUTH_EVENTS) {
            var service = {
                login: login,
                logout: logout,
                refresh: refresh,
                getSession: getSession
            };

            if (currentSession) {
                $rootScope.$$access_token = currentSession.access_token;
                $rootScope.$broadcast(AUTH_EVENTS.LOGIN_SUCCESS, currentSession);
            }

            return service;

            function login(usr, pwd, go) {
                var deferred = $q.defer();

                var request = $http({
                    method: 'POST',
                    url: provider.tokenEndpoint,
                    transformRequest: _transformRequestAsFormPost,
                    data: {
                        username: usr,
                        password: pwd,
                        grant_type: 'password'
                    }
                });

                request.success(_onLoginSuccess);
                request.error(_onLoginError);

                function _onLoginSuccess(tokenInfo) {
                    currentSession = tokenInfo;
                    if (tokenInfo.Claims) {
                        currentSession.Claims = _parseClaims(tokenInfo.Claims);
                    }
                    //if (tokenInfo.Claims.AppVersion[0] != window.appVersion) {
                    //    $rootScope.$broadcast(AUTH_EVENTS.LOGIN_REFRESH, currentSession);
                    //    return;
                    //}
                    $rootScope.$$access_token = tokenInfo.access_token;
                    deferred.resolve(tokenInfo);
                    $rootScope.$broadcast(AUTH_EVENTS.LOGIN_SUCCESS, currentSession);
                }

                function _onLoginError(msg) {
                    deferred.reject(msg);
                }

                return deferred.promise;
            }

            function logout() {
                var deferred = $q.defer();

                $timeout(function() {
                    $rootScope.$broadcast(AUTH_EVENTS.LOGOUT);
                    currentSession = null;
                    deferred.resolve();
                    location.reload();
                }, 0);

                return deferred.promise;
            };

            function refresh() {
                var deferred = $q.defer();

                $timeout(function() {
                    currentSession = null;
                    deferred.resolve();
                }, 0);

                return deferred.promise;
            };

            function getSession() {
                return currentSession;
            };

            function _transformRequestAsFormPost(data, getHeaders) {
                var headers = getHeaders();

                headers["Content-type"] = "application/x-www-form-urlencoded; charset=utf-8";

                if (!angular.isObject(data)) {
                    return ((data == null) ? "" : data.toString());
                }

                var buffer = [];
                for (var name in data) {
                    if (!data.hasOwnProperty(name)) {
                        continue;
                    }
                    var value = data[name];
                    buffer.push(
                        encodeURIComponent(name) +
                        "=" +
                        encodeURIComponent((value == null) ? "" : value)
                    );
                }

                var source = buffer
                    .join("&")
                    .replace(/%20/g, "+");

                return source;
            };

            function _parseClaims(claimString) {
                var claimSplit = claimString.split("|");
                var result = {};
                angular.forEach(claimSplit, function(value) {
                    var c = value.split(":");
                    if (result[c[0]]) {
                        result[c[0]].push(c[1]);
                    } else {
                        result[c[0]] = [c[1]];
                    }
                });
                return result;
            };
        }
    };

    AuthHttpInterceptor.$inject = ['$rootScope', '$q', 'AUTH_EVENTS', 'AuthRequestBuffer', 'Logger', '$injector'];

    function AuthHttpInterceptor($rootScope, $q, AUTH_EVENTS, AuthRequestBuffer, Logger, $injector) {
        var logger = Logger.createLogger('AUTH INTERCEPTOR');
        return {
            request: function (config) {
                if (config.url.indexOf('api') != -1 && $rootScope.$$access_token && config.url.indexOf('postcodes.io') == -1 && config.url.indexOf('aircall') == -1 && config.url.indexOf('maps.googleapis') == -1) {
                    config.headers.Authorization = "Bearer " + $rootScope.$$access_token;
                }
                return config;
            },
            responseError: function(rejection) {
                if (!angular.isDefined(rejection.config.retry) || rejection.config.retry) {
                    switch (rejection.status) {
                        case 401:
                            if (rejection.config.url.indexOf('aircall') == -1) {
                                logger.warning('Request Rejected ' + rejection.config.url);
                                var deferred = $q.defer();
                                AuthRequestBuffer.append(rejection.config, deferred);
                                $rootScope.$broadcast(AUTH_EVENTS.LOGIN_REQUIRED, rejection);
                                return deferred.promise;
                            }
                        case 403:
                            logger.warning('Request Refused ' + rejection.config.url);
                            $rootScope.$broadcast(AUTH_EVENTS.FORBIDDEN, rejection);
                            break;
                        case 500:
                            if (rejection.data.ExceptionMessage == "The operation cannot be completed because the DbContext has been disposed.") {
                                rejection.config.retry = false;
                                return $injector.get('$http')(rejection.config);
                            }
                            break;
                    }
                }
                return $q.reject(rejection);
            }
        };
    }

    AuthRequestBuffer.$inject = ['$injector'];

    function AuthRequestBuffer($injector) {
        var buffer = [];
        var $http;

        var service = {
            append: append,
            rejectAll: rejectAll,
            retryAll: retryAll
        };

        function append(config, deferred) {
            buffer.push({
                config: config,
                deferred: deferred
            });
        }

        function rejectAll(reason) {
            if (reason) {
                for (var i = 0; i < buffer.length; i++) {
                    buffer[i].deferred.reject(reason);
                }
            } else {
                buffer.length = 0;
            }
        }

        function retryAll() {
            for (var i = 0; i < buffer.length; i++) {
                _retryRequest(buffer[i].config, buffer[i].deferred);
            }
        }

        function _retryRequest(config, deferred) {
            $http = $http || $injector.get('$http');
            $http(config).then(deferred.resolve, deferred.reject);
        }

        return service;
    }

})(window, angular);