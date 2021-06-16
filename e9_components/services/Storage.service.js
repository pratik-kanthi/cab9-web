(function () {
    var module = angular.module('framework.services.storage', [])

    module.factory('$localStorage', _storageFactory('localStorage'));
    module.factory('$sessionStorage', _storageFactory('sessionStorage'));

    function _storageFactory(storageType) {
        return ['$rootScope', '$window', '$log',
            function ($rootScope, $window, $log) {
                // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
                var webStorage = $window[storageType] || ($log.warn('This browser does not support Web Storage!'), {}),
                    $storage = {
                        $default: function (items) {
                            for (var k in items) {
                                angular.isDefined($storage[k]) || ($storage[k] = items[k]);
                            }

                            return $storage;
                        },
                        $reset: function (items) {
                            for (var k in $storage) {
                                '$' === k[0] || delete $storage[k];
                            }

                            return $storage.$default(items);
                        }
                    },
                    _last$storage,
                    _debounce;

                for (var i = 0, k; i < webStorage.length; i++) {
                    // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
                    k = webStorage.key(i) 
                    try {
                        $storage[k] = angular.fromJson(webStorage.getItem(k)) } 
                    catch (e) {
                        $storage[k] = webStorage.getItem(k);
                    }
                }

                _last$storage = angular.copy($storage);

                $rootScope.$watch(function () {
                    _debounce || (_debounce = setTimeout(function () {
                        _debounce = null;

                        if (!angular.equals($storage, _last$storage)) {
                            angular.forEach($storage, function (v, k) {
                                angular.isDefined(v) && '$' !== k[0] && webStorage.setItem(k, angular.toJson(v));

                                delete _last$storage[k];
                            });

                            for (var k in _last$storage) {
                                webStorage.removeItem(k);
                            }

                            _last$storage = angular.copy($storage);
                        }
                    }, 100));
                });

                // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
                'localStorage' === storageType && $window.addEventListener && $window.addEventListener('storage', function (event) {
                    if ('ngStorage-' === event.key.slice(0, 10)) {
                        event.newValue ? $storage[event.key.slice(10)] = angular.fromJson(event.newValue) : delete $storage[event.key.slice(10)];

                        _last$storage = angular.copy($storage);

                        $rootScope.$apply();
                    }
                });

                return $storage;
            }
        ];
    }
})();