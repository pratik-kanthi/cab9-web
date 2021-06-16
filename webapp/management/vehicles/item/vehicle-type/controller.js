(function (angular) {
    var module = angular.module('cab9.vehicles');

    module.controller('vehicleTypesController', vehicleTypesController);

    vehicleTypesController.$inject = ['$scope', '$modal', 'rData', 'Model', '$q', 'LookupCache', 'Auth', '$rootScope'];

    function vehicleTypesController($scope, $modal, rData, Model, $q, LookupCache, Auth, $rootScope) {
        $scope.vehicleTypes = rData;
        $scope.saveVehicleType = saveVehicleType;
        $scope.EditVehicleType = EditVehicleType;

        function EditVehicleType(index) {
            var modalIns = $modal.open({
                templateUrl: '/webapp/management/vehicles/item/vehicle-type/vehicletype-edit.modal.html',
                backdrop: 'static',
                controller: ['$scope', '$modalInstance', '$http', '$config', 'Model', 'rItem', 'rTaxes', function ($scope, $modalInstance, $http, $config, Model, rItem, rTaxes) {
                    $scope.item = rItem;
                    $scope.Mode = 'EDIT';
                    $scope.taxes = rTaxes;
                    $scope.import = {
                        file: null
                    };
                    var importing = false;

                    $scope.save = function () {
                        if ($scope.import.file != undefined) {
                            if (!$scope.import.file.name.endsWith(".jpg") && !$scope.import.file.name.endsWith(".png")) {
                                swal('Upload Error', "image files only, file should end with '.jpg' or '.png'.", 'error');
                                return;
                            }
                            update($scope.import.file, $scope.item)
                                .then(function (item) {
                                    $scope.item.$isDelete = false;
                                    $modalInstance.close(item);
                                    swal("Edited", "Vehicle Type Saved.", "success");
                                }, function (error) {
                                    swal({
                                        title: "An Error Occured!",
                                        text: "Vehicle Type has not been Saved.",
                                        type: "error"
                                    });
                                }, function (percent) {
                                });
                        } else {
                            $scope.item.$update().success(function () {
                                swal("Edited", "Vehicle Type Saved.", "success");
                                $modalInstance.close($scope.item, false);
                            }).error(function () {
                                swal({
                                    title: "Error Occured",
                                    type: 'error'
                                });
                            });
                        }

                    }

                    function update(file, vehicletype) {
                        var deferred = $q.defer();

                        var fd = new FormData();
                        fd.append('file', file);
                        fd.append('vehicletype', JSON.stringify(vehicletype));
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
                        xhr.open('POST', $config.API_ENDPOINT + 'api/VehicleTypes/Update');
                        xhr.setRequestHeader("Authorization", "Bearer " + Auth.getSession().access_token);
                        xhr.setRequestHeader("Accept-Type", "application/json");
                        xhr.send(fd);

                        return deferred.promise;
                    }

                    $scope.delete = function () {
                        swal({
                            title: "Are you sure?",
                            text: "Vehicle Type will be deleted",
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonColor: '#DD6B55',
                            confirmButtonText: 'Yes, delete it!',
                            closeOnConfirm: false
                        },
                            function () {
                                $scope.deleting = true;
                                $scope.item.$delete().success(function () {
                                    $scope.item.$isDelete = true;
                                    swal("Deleted", "Vehicle Type Deleted.", "success");
                                    $modalInstance.close($scope.item);
                                }).error(function () {
                                    swal({
                                        title: "Error Occured",
                                        type: 'error'
                                    });
                                });
                            },
                            function (err) {
                                swal({
                                    title: "Some Error Occured.",
                                    text: "Some error has occured.",
                                    type: "error",
                                    confirmButtonColor: $UI.COLOURS.brandSecondary
                                });
                            })
                    }

                    $scope.close = function(){                    
                        $scope.item.$rollback();
                        $modalInstance.close();
                    }
                }],
                resolve: {
                    rItem: function () {
                        return $scope.vehicleTypes.find(function (i) { return i.Id == index; });
                    },
                    rTaxes: function () {
                        return Model.Tax.query().execute();
                    }
                }
            })

            modalIns.result.then(function (res) {
                if (res != null) {
                    if (!res.$isDelete) {
                        $scope.vehicleTypes = $scope.vehicleTypes.filter(function (d) {
                            return d.Id != res.Id;
                        });
                        if (res.ImageUrl) {
                            if (res.ImageUrl.slice(0, 4) == 'http') {
                                res._ImageUrl = res.ImageUrl;
                            } else {
                                res._ImageUrl = window.resourceEndpoint + res.ImageUrl;
                            }
                        }
                        $scope.vehicleTypes.push(res);
                        $scope.vehicleTypes.sort(function(a, b){
                            return a.Priority-b.Priority
                        })
                    }
                    else {
                        $scope.vehicleTypes = $scope.vehicleTypes.filter(function (d) {
                            return d.Id != res.Id;
                        });
                    }
                }
            });
        }

        function saveVehicleType() {
            var modalIns = $modal.open({
                templateUrl: '/webapp/management/vehicles/item/vehicle-type/vehicletype-edit.modal.html',
                backdrop: 'static',
                controller: ['$scope', '$modalInstance', '$http', '$config', 'Model', 'rItem', function ($scope, $modalInstance, $http, $config, Model, rItem) {
                    $scope.item = rItem;
                    $scope.Mode = 'CREATE';
                    $scope.import = {
                        file: null
                    };
                    var importing = false;

                    $scope.save = function () {
                        $scope.item.TenantId = Auth.getSession().TenantId;
                        if ($scope.import.file != undefined) {
                            if (!$scope.import.file.name.endsWith(".jpg") && !$scope.import.file.name.endsWith(".png")) {
                                swal('Upload Error', "image files only, file should end with '.jpg' or '.png'.", 'error');
                                return;
                            }
                            update($scope.import.file, $scope.item)
                                .then(function (item) {
                                    $modalInstance.close(item);
                                    swal("Saved", "Vehicle Type Saved.", "success");
                                }, function (error) {
                                    swal({
                                        title: "An Error Occured!",
                                        text: "Vehicle Type has not been Added.",
                                        type: "error"
                                    });
                                }, function (percent) {
                                });
                        } else {
                            $scope.item.$save().success(function () {
                                swal("Saved", "Vehicle Type Saved.", "success");
                                $modalInstance.close($scope.item);
                            }).error(function () {
                                swal({
                                    title: "Error Occured",
                                    type: 'error'
                                });
                            });
                        }

                    }

                    function update(file, vehicletype) {
                        var deferred = $q.defer();

                        var fd = new FormData();
                        fd.append('file', file);
                        fd.append('vehicletype', JSON.stringify(vehicletype));
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
                        xhr.open('POST', $config.API_ENDPOINT + 'api/VehicleTypes/Update');
                        xhr.setRequestHeader("Authorization", "Bearer " + Auth.getSession().access_token);
                        xhr.setRequestHeader("Accept-Type", "application/json");
                        xhr.send(fd);

                        return deferred.promise;
                    }

                    $scope.close = function(){                    
                        $scope.item.$rollback();
                        $modalInstance.close();
                    }
                }],
                resolve: {
                    rItem: function () {
                        return new Model.VehicleType();
                    }
                }
            })

            modalIns.result.then(function (res) {
                if (res != null) {
                    if (res.ImageUrl) {
                        if (res.ImageUrl.slice(0, 4) == 'http') {
                            res._ImageUrl = res.ImageUrl;
                        } else {
                            res._ImageUrl = window.resourceEndpoint + res.ImageUrl;
                        }
                    }
                    $scope.vehicleTypes.push(res);
                    $scope.vehicleTypes.sort(function(a, b){
                        return a.Priority-b.Priority
                    })
                }
            });
        }

    }
})(angular);