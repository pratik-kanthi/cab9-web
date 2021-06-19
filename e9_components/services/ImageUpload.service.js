(function(window, angular) {
    var app = angular.module("framework.services.images", []);

    app.provider('ImageUpload', ImageUploadProvider);
    app.controller('ImageUploadModalController', ImageUploadModalController);
    app.directive('filePicker', FilePicker);
    app.directive('fileDataPicker', FileDataPicker);
    app.directive('imageCropper', ImageCropper);
    //app.run(['$rootScope', 'ImageUpload', function($rootScope, ImageUpload) { $rootScope.chooseImage = ImageUpload.openPicker; }]);
    FileDataPicker.$inject = ['$timeout'];

    function ImageUploadProvider() {
        var provider = {
            $get: ['$http', '$modal', '$config', '$q', getService]
        };

        return provider;

        function getService($http, $modal, $config, $q) {
            var service = {
                openPicker: openPicker,
                upload: upload,
                current: current,
                performSearch: performSearch
            };

            function openPicker(config) {
                return $modal.open({
                    templateUrl: '/e9_components/services/ImageUpload.modal.html',
                    controller: 'ImageUploadModalController',
                    backdrop: 'static',
                    windowClass: 'image-upload-modal',
                    resolve: {
                        modalConfig: function() {
                            return config || {};
                        }
                    }
                }).result;
            }

            function upload(file, params) {
                var fd = new FormData();
                fd.append('file', file);
                return $http.post($config.API_ENDPOINT + 'api/Image', fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    },
                    params: params
                });
            }

            function current(params) {
                return $http.get($config.API_ENDPOINT + 'api/Image', {
                    params: params
                });
            }

            function performSearch(term) {
                var deferred = $q.defer();
                var searchEngine = new google.search.ImageSearch();
                searchEngine.setResultSetSize(8);
                searchEngine.setSearchCompleteCallback(this, function() {
                    if (searchEngine.results && searchEngine.results.length > 0) {
                        deferred.resolve(searchEngine.results);
                    } else {
                        deferred.reject();
                    }
                }, null);
                searchEngine.execute(term);
                return deferred.promise;
            }

            return service;
        }
    };

    ImageUploadModalController.$inject = ['$scope', '$modalInstance', '$timeout', 'modalConfig', 'ImageUpload', '$config'];

    function ImageUploadModalController($scope, $modalInstance, $timeout, modalConfig, ImageUpload, $config) {
        $scope.mode = modalConfig.mode;
        $scope.modes = (modalConfig.modes || {
            UPLOAD: true,
            SEARCH: true,
            PREVIOUS: true
        });

        $scope.upload = {
            choosen: null,
            src: null,
            dimensions: null,
            allowRect: true,
            uploadFull: function() {
                ImageUpload.upload($scope.upload.choosen, {
                    type: modalConfig.type,
                    id: modalConfig.id
                }).success(function(data) {
                    $modalInstance.close(data[0]);
                }).error(function() {
                    console.log(arguments);
                });
            },
            uploadCropped: function() {
                ImageUpload.upload($scope.upload.choosen, {
                    type: modalConfig.type,
                    id: modalConfig.id,
                    cropx: $scope.upload.dimensions.x,
                    cropy: $scope.upload.dimensions.y,
                    cropx2: $scope.upload.dimensions.x2,
                    cropy2: $scope.upload.dimensions.y2,
                    height: $scope.upload.dimensions.h,
                    width: $scope.upload.dimensions.w
                }).success(function(data) {
                    $modalInstance.close(data[0]);
                }).error(function() {
                    console.log(arguments);
                });
            }
        }
        $scope.$watch('upload.choosen.name + upload.choosen.size', function(newvalue) {
            if (!newvalue) {
                $scope.upload.src = null;
            } else {
                var reader = new FileReader();
                reader.onload = function(e) {
                    $scope.upload.src = e.target.result;
                    $scope.$apply();
                }
                reader.readAsDataURL($scope.upload.choosen);
            }
        });


        $scope.search = {
            term: (modalConfig.searchTerm || ''),
            debounce: null,
            choosen: null,
            dimensions: null,
            allowRect: true,
            fetchResults: function() {
                ImageUpload.performSearch($scope.search.term)
                    .then(function(data) {
                        $scope.search.results = data;
                    }, function() {

                    })
            },
            select: function(image) {
                $scope.search.choosen = image.unescapedUrl;
            },
            uploadFull: function() {
                ImageUpload.upload($scope.upload.choosen, {
                    type: modalConfig.type,
                    id: modalConfig.id,
                    remote: $scope.search.choosen
                }).success(function(data) {
                    $modalInstance.close(data[0]);
                }).error(function() {
                    console.log(arguments);
                });
            },
            uploadCropped: function() {
                ImageUpload.upload($scope.upload.choosen, {
                    type: modalConfig.type,
                    id: modalConfig.id,
                    remote: $scope.search.choosen,
                    cropx: $scope.search.dimensions.x,
                    cropy: $scope.search.dimensions.y,
                    cropx2: $scope.search.dimensions.x2,
                    cropy2: $scope.search.dimensions.y2,
                    height: $scope.search.dimensions.h,
                    width: $scope.search.dimensions.w
                }).success(function(data) {
                    $modalInstance.close(data[0]);
                }).error(function() {
                    console.log(arguments);
                });
            }
        }
        $scope.$watch('search.term', function(newvalue) {
            $scope.search.choosen = null;
            if (!newvalue) {
                $scope.search.results = [];
            } else {
                if ($scope.search.debounce) {
                    $timeout.cancel($scope.search.debounce);
                    $scope.search.debounce = null
                }
                $scope.search.debounce = $timeout(function() {
                    $scope.search.fetchResults();
                }, 1000);
            }
        }, true);

        $scope.previous = {
            list: [],
            accessors: {
                LogoUrl: function(item) {
                    return $config.API_ENDPOINT + item;
                }
            },
            getCurrent: function() {
                ImageUpload.current({
                    type: modalConfig.type,
                    id: modalConfig.id
                }).success(function(data) {
                    $scope.previous.list = data;
                }).error(function() {

                })
            },
            select: function(previous) {
                $modalInstance.close(previous);
            }
        }

        $scope.previous.getCurrent();
    }

    function ImageCropper() {
        return {
            restrict: 'A',
            scope: {
                source: '=',
                result: '=',
                allowRect: '='
            },
            link: function($scope, $element, $attrs) {
                var jcrop = null;

                $scope.$watch('source', function(newval) {
                    if (jcrop) {
                        jcrop.destroy();
                        jcrop = null;
                    }
                    if (newval) {
                        $($element).removeAttr('style');
                        $($element).attr('style', "width:100%");
                        $attrs.$set('src', newval);

                        var img = new Image();
                        img.onload = function() {
                            var height = img.height;
                            var width = img.width;
                            var jcropConfig = {
                                trueSize: [width, height],
                                boxWidth: 320,
                                allowSelect: false,
                                setSelect: [10, 10, 110, 110],
                                onSelect: onSelect,
                                onRelease: onRelease
                            };
                            if (!$scope.allowRect) {
                                jcropConfig.aspectRatio = 1;
                                jcropConfig.minSize = [100, 100];
                            }
                            $($element).Jcrop(jcropConfig, function() {
                                jcrop = this;
                            });
                            $scope.$apply();

                            function onRelease() {
                                jcrop.setSelect([10, 10, 110, 110]);
                            }
                        };
                        img.src = newval;
                    } else {
                        $attrs.$set('src', null);
                    }
                });

                function onSelect(coords) {
                    for (var key in coords) {
                        coords[key] = Math.round(coords[key]);
                    }
                    $scope.result = coords;
                }
            }
        }
    }

    FilePicker.$inject = ['$timeout'];

    function FilePicker($timeout) {
        return {
            scope: {
                file: "="
            },
            link: function(scope, element, attributes) {
                scope.safeApply = function(fn) {
                    var phase = scope.$$phase;
                    if (phase == '$apply' || phase == '$digest') {
                        if (fn && (typeof(fn) === 'function')) {
                            fn();
                        }
                    } else {
                        scope.$apply();
                    }
                };
                element.bind("change", function(changeEvent) {
                    var file = changeEvent.target.files[0];
                    if (file) {
                        scope.file = file;
                        $timeout(scope.safeApply, 0);
                    }
                    // else {
                    //     scope.file = null;
                    //     $timeout(scope.safeApply, 0);
                    // }
                });
            }
        };
    }

    function FileDataPicker($timeout) {
        return {
            scope: {
                file: "=",
                data: "="
            },
            link: function(scope, element, attributes) {
                scope.safeApply = function(fn) {
                    var phase = scope.$$phase;
                    if (phase == '$apply' || phase == '$digest') {
                        if (fn && (typeof(fn) === 'function')) {
                            fn();
                        }
                    } else {
                        scope.$apply();
                    }
                };
                element.bind("change", function(changeEvent) {
                    var file = changeEvent.target.files[0];
                    if (file) {
                        var reader = new FileReader();
                        reader.readAsText(file);
                        reader.onload = function(changeEvent) {
                            scope.data = changeEvent.target.result.substr(0, 100) + "...";
                            $timeout(scope.safeApply, 0);
                        };
                        scope.file = file;
                        $timeout(scope.safeApply, 0);
                    } else {
                        scope.file = null;
                        //                        scope.data = null;
                        $timeout(scope.safeApply, 0);
                    }
                });
            }
        };
    }
})(window, angular);