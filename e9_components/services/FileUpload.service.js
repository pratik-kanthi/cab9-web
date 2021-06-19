(function (window, angular) {
    var app = angular.module("framework.services.documents", []);

    app.provider('FileUpload', FileUploadProvider);
    app.controller('FileUploadModalController', FileUploadModalController);

    function FileUploadProvider() {
        var provider = {
            $get: ['$http', '$modal', '$config', '$q', '$rootScope', getService]
        };

        return provider;

        function getService($http, $modal, $config, $q, $rootScope) {
            var service = {
                openPicker: openPicker,
                upload: upload,
                update: update,
                delete: deleteDocument,
                current: current,

            };

            function openPicker(config) {
                return $modal.open({
                    templateUrl: 'common_components/services/FileUpload.modal.html',
                    controller: 'FileUploadModalController',
                    resolve: {
                        modalConfig: function () {
                            return config || {};
                        }
                    }
                }).result;
            }

            function upload(file, document) {
                var deferred = $q.defer();

                var fd = new FormData();
                fd.append('file', file);
                fd.append('document', JSON.stringify(document));
                var xhr = new XMLHttpRequest();
                xhr.upload.onprogress = function (e) {
                    $rootScope.$apply(function () {
                        if (e.lengthComputable) {
                            deferred.notify(Math.round(e.loaded / e.total * 100));
                        }
                    })
                }
                xhr.onload = function (e) {
                    if (e.target.readyState == 4) {
                        if (e.target.status == 200) {
                            deferred.resolve(JSON.parse(e.target.response));
                        } else {
                            deferred.reject(e.target.responseText);
                        }
                    }
                }
                xhr.onerror = function (e) {
                    deferred.reject(e);
                }
                xhr.onabort = function (e) {
                    deferred.reject(e);
                }
                xhr.open('POST', $config.API_ENDPOINT + 'api/File', true);
                xhr.setRequestHeader("Authorization", "Bearer " + $rootScope.$$access_token);
                xhr.setRequestHeader("Accept-Type", "application/json");
                xhr.send(fd);

                return deferred.promise;
            }

            function update(file, document) {
                var deferred = $q.defer();

                var fd = new FormData();
                fd.append('file', file);
                fd.append('document', JSON.stringify(document));
                var xhr = new XMLHttpRequest();
                xhr.upload.onprogress = function (e) {
                    $rootScope.$apply(function () {
                        if (e.lengthComputable) {
                            deferred.notify(Math.round(e.loaded / e.total * 100));
                        }
                    })
                }
                xhr.onload = function (e) {
                    if (e.target.readyState == 4) {
                        if (e.target.status == 200) {
                            deferred.resolve(JSON.parse(e.target.response));
                        } else {
                            deferred.reject(e.target.responseText);
                        }
                    }
                }
                xhr.onerror = function (e) {
                    deferred.reject(e);
                }
                xhr.onabort = function (e) {
                    deferred.reject(e);
                }
                xhr.open('PUT', $config.API_ENDPOINT + 'api/File?documentId=' + document.Id, true);
                xhr.setRequestHeader("Authorization", "Bearer " + $rootScope.$$access_token);
                xhr.setRequestHeader("Accept-Type", "application/json");
                xhr.send(fd);

                return deferred.promise;
            }

            function deleteDocument(id) {
                var deferred = $q.defer();
                $http.delete($config.API_ENDPOINT + 'api/File?documentId=' + id).success(function (data) {
                    deferred.resolve(data);
                }).error(function (reason) {
                    deferred.reject(reason);
                })
                return deferred.promise;
            }

            function current(params) {
                return $http.get($config.API_ENDPOINT + 'api/File', {
                    params: params
                });
            }

            return service;
        }
    };

    FileUploadModalController.$inject = ['$scope', '$modalInstance', '$timeout', 'modalConfig', 'FileUpload'];

    function FileUploadModalController($scope, $modalInstance, $timeout, modalConfig, FileUpload) {
        $scope.upload = {
            choosen: null,
            src: null,
            upload: function () {
                FileUpload.upload($scope.upload.choosen, {
                    type: modalConfig.type,
                    id: modalConfig.id
                }).success(function (data) {
                    $modalInstance.close(data[0]);
                }).error(function () {
                    console.log(arguments);
                });
            }
        }
        $scope.$watch('upload.choosen', function (newvalue) {
            if (!newvalue) {
                $scope.upload.src = null;
            } else {
                var imageTypes = [".jpg", ".jpeg", ".png", ".gif"];
                var image = imageTypes.filter(function (type) {
                    return newvalue.indexOf(type) >= 0;
                }).length > 0;
                if (image) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        $scope.upload.src = e.target.result;
                    }
                    reader.readAsDataURL(newvalue);
                } else {
                    $scope.upload.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADSCAAAAABRWhJzAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9kDCgAsJjrEk6AAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAElklEQVR42u3YW2wUVRwG8M/d7ZbuktZaXghCBEtSVhBoqRsJ4otJNRqbhiaGiEq8PGC8xEvxSU3wEjVCNaaCmGggBJXEpKJAEIQHgzExpiTGQuRFMdaChbbsbltLu58P05mdc2bweSb99mVPvv+0Ob/MmTNn/+As+0BggQUWWGCBBRZYYIEFFlhggQUWWGCBBRZYYIEFFlhggQUWWGCBBRZYYIEFFlhggQUWWGCBBRZYYIEFFlhggQUWWGCBBRZYYIEFFlhggQUWWGCBBRZYYIEFFlhggQUWWGCBBRY4omDgxZlvkhx59dZsdsXLw8YFwNw7vnaH2fz+Sg4AXI0DTnIAzTP/x6vxJvSR/B7AOZJ9WBwBcNVZD9y/yJnoon4TDOCrynCvCf4QdztXtmFnAPwoukm+jirsJtmNxyIARpsLLi3FyiOF4tFVWFryXUBe2IT8zPCfx7HStyRIjmQSf5Lk+URm1AO7f70P95O8C09gI8l27I8A+B70zszxPSwrkGShCe8bYF5CjTscRrUJ5ma8RpLbsJkB8ADqpzmZSfyenE9O12MwAuAzqcXjzhzX43Mn/Ax3muDLfnCtBT6Fm8tkeQlOBcFsws/8AavYin724ZYobFp8FtucOd6AC074NxoM8MVH/Eu603yGyRxOkieQIwPPMJ/Eu3wTz7ELPezG05EAX27I/EGATOGqE04iZW9avd6wZcAGd2MT+SB2hIG/xH1sw0EeQifb0RsJMHvQad7hQeMOA9l13msJ2W9oLWkOVdeMjtSkhxiypC8l6ibmJkd4JTVvqj45HA3w1HJ89//PsDec+GJO+ic750bs2okHGAbmanyANSRvwx60MhpgHkfO2aVzRZIs5uxd2jfcjtayDT6B1jU4Hg5+AQvQRXIrGvFSVMBsB0AWG9F8tFg61my/h/3DyWXYZYPLjcCScjj4EIDDJA8D+DYy4HNp56S10NlsFvbzmmAeQ92AuTGRbwFvkGGbFgsppAokr6SQHosMmF3O9/ArKzKZ5dZZ2h5uQIcNHqxK/nUNMNciT5LMY71+LQkssMACCyywwLMWPNFQP05abUg3DTsn+0tAuuntafNsZpy4IgjeB+whrTakm4aB/SUAwNZ4gdcBa2m3Id00DGyWSu9gng2O9JL+Ffnb8QutNqSXBsF26V/MiRX4GXy0F0/RakN6aRBslca24944gceuz4yON9SVaLQhfakNNksA0g9fjNMz/CkeIp/HJzTakL7UBpslAFjQEydwHifJ367L02hD+lIbbJeununAjvgs6dPu7ThNXxvSSE1wsMQh3Bgf8BZ3/lvoa0MaqQkOljiE6tiAC7WJ887Lt7ZYaUOaqQEOlqbOdqA5NuDdlePVx/TakGZqNOjsEgAgdcTYqqK8abVUDtAt9NqQZmqA7RKQnL/hR8YGrJ+HAgsssMACCyywwAILLLDAAgsssMACCyywwAILLLDAAgsssMACCyywwAILLLDAAgsssMACCyywwAILLLDAAgsssMACCyywwAILLLDAAgsssMACCyywwAILLLDAAgsssMACCyywwLPp8x9MOC7ZMPt+VQAAAABJRU5ErkJggg==";
                }
            }
        }, true);
    }
})(window, angular);