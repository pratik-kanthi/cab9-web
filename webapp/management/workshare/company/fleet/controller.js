(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorkshareCompanyFleetController', workshareCompanyFleetController);

    workshareCompanyFleetController.$inject = ['$scope', 'Model', '$http', '$config', 'rCompanyProfile'];

    function workshareCompanyFleetController($scope, Model, $http, $config, rCompanyProfile) {
        $scope.companyProfile = rCompanyProfile;
        $scope.viewMode = 'VIEW';
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.updateAddService = updateAddService;
        $scope.saveEdits = saveEdits;
        Model.VehicleType
            .query()
            .execute()
            .then(function (result) {
                $scope.vehicleTypes = result;
            }, function (err) {
                swal("Error Fetching VehicleTypes", err.ExceptionMessage, "error");
            })
        $scope.loading = true;
        $http.get($config.API_ENDPOINT + 'api/partners/services')
            .success(function (data) {
                $scope.services = data;
                fetchProfileServices();
            })
            .error(function (res) {
                $scope.loading = false;
                swal("Error", res.ExceptionMessage, "error");
            });

        function fetchProfileServices() {
            $http.get($config.API_ENDPOINT + 'api/partners/profile/service?profileId=' + $scope.companyProfile.Id)
                .success(function (data) {
                    for (i = 0, len = data.length; i < len; i++) {
                        for (j = 0, leng = $scope.services.length; j < leng; j++) {
                            if (data[i].WorkshareLevelsOfServiceId == $scope.services[j].Id) {
                                $scope.services[j].Id = data[i].Id;
                                $scope.services[j].WorkshareLevelsOfServiceId = data[i].WorkshareLevelsOfServiceId;
                                $scope.services[j].VehicleTypeId = data[i].VehicleTypeId;
                                $scope.services[j]._VehicleTypeId = data[i].VehicleTypeId;
                                break;
                            }
                        }
                    }
                    $scope.loading = false;
                })
                .error(function (res) {
                    $scope.loading = false;
                    swal("Error", res.ExceptionMessage, "error");
                });
        }
        var levelOfService = null;

        manageCompanyAllowedServices();

        function updateAddService(service, index) {
            service.$loading = true;
            service.$tick = false;
            if (service.VehicleTypeId && !service._VehicleTypeId) {
                if (service.VehicleTypeId) {
                    $http.delete($config.API_ENDPOINT + 'api/partners/profile/service?serviceId=' + service.Id).success(function (data) {
                            startLoading(service)
                            service.Id = service.WorkshareLevelsOfServiceId;
                            delete service._VehicleTypeId;
                            delete service.VehicleTypeId;
                        })
                        .error(function (res) {
                            service.$loading = false;
                            swal("Error", res.ExceptionMessage, "error");
                        });
                } else {
                    return
                }
            } else if (!service.VehicleTypeId && service._VehicleTypeId) {
                $http.post($config.API_ENDPOINT + 'api/partners/profile/service', {
                        "CompanyProfileId": $scope.companyProfile.Id,
                        "WorkshareLevelsOfServiceId": service.Id,
                        "VehicleTypeId": service._VehicleTypeId
                    }).success(function (data) {
                        startLoading(service)
                        service.Id = data.Id;
                        service.WorkshareLevelsOfServiceId = data.WorkshareLevelsOfServiceId;
                        service.VehicleTypeId = service._VehicleTypeId;
                    })
                    .error(function (res) {
                        service.$loading = false;
                        swal("Error", res.ExceptionMessage, "error");
                    });
            } else {
                $http.put($config.API_ENDPOINT + 'api/partners/profile/service?serviceId=' + service.Id, {
                        "CompanyProfileId": $scope.companyProfile.Id,
                        "WorkshareLevelsOfServiceId": service.WorkshareLevelsOfServiceId,
                        "VehicleTypeId": service._VehicleTypeId
                    }).success(function (data) {
                        startLoading(service)
                        service.WorkshareLevelsOfServiceId = data.WorkshareLevelsOfServiceId;
                        service.VehicleTypeId = service._VehicleTypeId;
                    })
                    .error(function (res) {
                        service.$loading = false;
                        swal("Error", res.ExceptionMessage, "error");
                    });
            }

        }

        function startLoading(service) {
            service.$loading = false;
            service.$tick = true;
            setTimeout(function () {
                service.$tick = false;
                $scope.$apply()
            }, 2000)
        }

        function manageCompanyAllowedServices() {
            if ($scope.companyProfile && $scope.companyProfile.AllowedServices) {
                var allowedServices = $scope.companyProfile.AllowedServices.replaceAll(" ", "").split(",");
                if (allowedServices.indexOf("Standard") > -1) {
                    $scope.companyProfile.$AllowStandard = true;
                }
                if (allowedServices.indexOf("Executive") > -1) {
                    $scope.companyProfile.$AllowExecutive = true;
                }
                if (allowedServices.indexOf("MPV") > -1) {
                    $scope.companyProfile.$AllowMPV = true;
                }
                if (allowedServices.indexOf("Premium") > -1) {
                    $scope.companyProfile.$AllowPremium = true;
                }
                if (allowedServices.indexOf("Estate") > -1) {
                    $scope.companyProfile.$AllowEstate = true;
                }
            }
            levelOfService = angular.copy($scope.companyProfile);
        }

        function startEdit() {
            if (!$scope.companyProfile) {
                $scope.companyProfile = new Model.CompanyProfile();
            }
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.companyProfile = levelOfService;
            manageCompanyAllowedServices();
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            var allowedServices = [];
            if ($scope.companyProfile.$AllowStandard) {
                allowedServices.push("Standard");
            }

            if ($scope.companyProfile.$AllowExecutive) {
                allowedServices.push("Executive");
            }
            if ($scope.companyProfile.$AllowMPV) {
                allowedServices.push("MPV");
            }

            if ($scope.companyProfile.$AllowPremium) {
                allowedServices.push("Premium");
            }

            if ($scope.companyProfile.$AllowEstate) {
                allowedServices.push("Estate");
            }

            $scope.companyProfile.AllowedServices = allowedServices.join(",");

            $http.put($config.API_ENDPOINT + 'api/partners/profile?profileId=' + $scope.companyProfile.Id, $scope.companyProfile)
                .success(function (data) {
                    swal({
                        title: "Profile updated",
                        text: "Company Profile has been updated",
                        type: "success"
                    });
                    $scope.viewMode = 'VIEW';
                })
                .error(function (res) {
                    swal("Error", res.ExceptionMessage, "error");
                });
        }
    }
}(angular));