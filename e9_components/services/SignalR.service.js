(function () {
    var module = angular.module('framework.services.signalr', []);

    module.provider('SignalR', function () {
        var endpoint = '';
        var hubname = '';
        var qs = {};
        var events = [];
        return {
            setHub: function (hub) {
                hubname = hub;
            },
            setEndpoint: function (value) {
                endpoint = value;
            },
            setQueryValue: function (name, value) {
                qs[name] = value;
            },
            registerEvent: function (value) {
                events.push(value);
            },
            $get: ['$q', '$rootScope', '$timeout', getService]
        };


        function getService($q, $rootScope, $timeout) {
            var service = {
                hub: $.connection[hubname],
                running: false,
                setHub: function (hub) {
                    hubname = hub;
                    //restart
                },
                setEndpoint: function (value) {
                    endpoint = value;
                    //restart
                },
                setQueryValue: function (name, value) {
                    qs[name] = value;
                    //restart
                },
                registerEvent: function (value) {
                    events.push(value);
                    //restart
                },
                start: startService,
                server: null
            };

            $rootScope.SIGNALR = {
                status: 0
            };

            return service;

            function startService() {
                var deferred = $q.defer();
                this.hub.connection.url = endpoint;
                this.hub.connection.qs = qs;
                angular.forEach(events, function (ev) {
                    this.hub.client[ev] = function () {
                        $rootScope.$broadcast('SIGNALR_' + ev, arguments);
                    }
                }, this);
                this.server = this.hub.server;
                this.running = true;
                this.hub.connection.disconnected(function () {
                    $rootScope.SIGNALR.status = 0;
                    console.log('SignalR: Disconnected');
                    $rootScope.$apply();
                    $timeout(function () {
                        this.hub.connection.start().done(function () {
                            $rootScope.SIGNALR.status = 4;
                            console.log('SignalR: Connected');
                            $rootScope.$apply();
                        });
                    }, 1000);
                });
                this.hub.connection.starting(function () {
                    $rootScope.SIGNALR.status = 1;
                    console.log('SignalR: Starting');
                    $rootScope.$apply();
                });
                this.hub.connection.reconnecting(function () {
                    $rootScope.SIGNALR.status = 2;
                    console.log('SignalR: Reconnecting');
                    $rootScope.$apply();
                });
                this.hub.connection.connectionSlow(function () {
                    $rootScope.SIGNALR.status = 3;
                    console.log('SignalR: Connection Slow');
                    $rootScope.$apply();
                    $timeout(function () {
                        $rootScope.SIGNALR.status = 4;
                        console.log('SignalR: Connection Restored');
                        $rootScope.$apply();
                    }, 4000);
                });
                this.hub.connection.reconnected(function () {
                    $rootScope.SIGNALR.status = 4;
                    console.log('SignalR: Reconnected');
                    $rootScope.$apply();
                });
                this.hub.connection.start().done(function () {
                    $rootScope.SIGNALR.status = 4;
                    console.log('SignalR: Connected');
                    deferred.resolve();
                    //$rootScope.$apply();
                });
                return deferred.promise;
            }
        }
    });
}());