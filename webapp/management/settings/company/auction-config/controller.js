(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('SettingsAuctionConfigController', SettingsAuctionConfigController);

    SettingsAuctionConfigController.$inject = ['$scope', 'rCompany', 'rCompanyBiddingConfig', 'rBiddingAutomationRules', 'rClients', 'rVehicleTypes', 'rDriverTypes', 'Auth', '$http', 'Model', '$UI', '$modal', 'rExclusionRules'];

    function SettingsAuctionConfigController($scope, rCompany, rCompanyBiddingConfig, rBiddingAutomationRules, rClients, rVehicleTypes, rDriverTypes, Auth, $http, Model, $UI, $modal, rExclusionRules) {
        $scope.company = rCompany[0];
        $scope.companyBiddingConfig = rCompanyBiddingConfig[0];
        $scope.automationRules = rBiddingAutomationRules.sort(sortArrayByTwoProperties('-Active', 'ClientName'));
        $scope.clients = rClients;
        $scope.driverTypes = rDriverTypes;
        $scope.vehicleTypes = rVehicleTypes;
        $scope.exclusionRules = rExclusionRules;


        if ($scope.companyBiddingConfig == undefined)
            $scope.companyBiddingConfig = new Model.CompanyBiddingConfig();
        $scope.viewMode = 'VIEW';
        $scope.ruleViewMode = 'VIEW';
        $scope.startEdit = startEdit;
        $scope.startRuleEdit = startRuleEdit;
        $scope.cancelEdit = cancelEdit;

        $scope.saveEdits = saveEdits;

        $scope.deleteAutomationRule = deleteAutomationRule;
        $scope.ChangeAuctionBiddingSetting = ChangeAuctionBiddingSetting;
        $scope.deactivateAutomationRule = deactivateAutomationRule;
        $scope.activateAutomationRule = activateAutomationRule;
        $scope.editAutomationRule = editAutomationRule;
        $scope.openExclusionsModal = openExclusionsModal;

        function sortArrayByTwoProperties(property1, property2) {
            var sortOrder1 = 1;
            var sortOrder2 = 1;
        
            if (property1[0] === '-') {
                sortOrder1 = -1;
                property1 = property1.substr(1);
            }

            if (property2[0] === '-') {
                sortOrder2 = -1;
                property2 = property2.substr(1);
            }

            return function (a, b) {
                var result = a[property1] < b[property1] ? -1 : a[property1] > b[property1] ? 1 : 0;
                result = result * sortOrder1;
                if (result == 0) {
                    result = a[property2] < b[property2] ? -1 : a[property2] > b[property2] ? 1 : 0;
                    result = result * sortOrder2;
                }

                return result;
            };
        };

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }



        function cancelEdit() {
            $scope.companyBiddingConfig.$rollback(false);
            $scope.viewMode = 'VIEW';
        }



        function saveEdits() {
            if ($scope.companyBiddingConfig != undefined && $scope.companyBiddingConfig.Id != undefined) {
                $scope.companyBiddingConfig.$patch().success(function() {
                    $scope.viewMode = 'VIEW';
                    location.reload();
                });
            } else {
                $scope.companyBiddingConfig.TenantId = Auth.getSession().TenantId;
                $http.post($config.API_ENDPOINT + 'api/companyBiddingConfigs', $scope.companyBiddingConfig)
                    .success(function() {
                        $scope.viewMode = 'VIEW';
                        location.reload();
                    }).error(function(error) {
                        $scope.viewMode = 'VIEW';
                        swal("Error", "Please try again or contact admin", "error");
                    });
            }
        }




        function deleteAutomationRule(automationRuleId) {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to delete the Automation rule?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Delete",
                closeOnConfirm: true
            }, function() {
                $http({
                    method: 'DELETE',
                    url: $config.API_ENDPOINT + 'api/Bid/automation-rules?automationRuleId=' + automationRuleId
                }).then(function successCallback(response) {
                    swal("Automation Rule Deleted", "The automation rule has been deleted.", "success");
                    location.reload();
                }, function errorCallback(error) {
                    swal("An Error Occurred.", (error.ExceptionMessage) ? error.ExceptionMessage : "There was an error. Please try again.", "error");
                });
            }, function() {
                swal("Error!", "Some Issue while deleting.", "error");
            });
        }

        function deactivateAutomationRule(automationRuleId) {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to deactivate the Automation rule?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Deactivate",
                closeOnConfirm: true
            }, function() {
                $http({
                    method: 'POST',
                    url: $config.API_ENDPOINT + 'api/Bid/deactivate-rule?ruleId=' + automationRuleId
                }).then(function successCallback(response) {
                    swal("Automation Rule Deactivated", "The automation rule has been Deactivated.", "success");
                    location.reload();
                }, function errorCallback(error) {
                    swal("An Error Occurred.", (error.Message) ? error.Message : "There was an error. Please try again.", "error");
                });
            }, function() {
                swal("Error!", "Some Issue while deactivating rule.", "error");
            });
        }

        function activateAutomationRule(automationRuleId) {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to activate the Automation rule?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Activate",
                closeOnConfirm: true
            }, function() {
                $http({
                    method: 'POST',
                    url: $config.API_ENDPOINT + 'api/Bid/activate-rule?ruleId=' + automationRuleId
                }).then(function successCallback(response) {
                    swal("Automation Rule activated", "The automation rule has been Activated.", "success");
                    location.reload();
                }, function errorCallback(error) {
                    swal("An Error Occurred.", (error.Message) ? error.Message : "There was an error. Please try again.", "error");
                });
            }, function() {
                swal("Error!", "Some Issue while activating rule.", "error");
            });
        }

        function startRuleEdit() {

            var newRule = new Model.BiddingFilter();
            newRule.$StartPeriodType = 'HOURS';
            newRule.$EndPeriodType = 'DAYS';

            $modal.open({
                templateUrl: '/webapp/management/settings/company/auction-config/modals/create-edit.partial.html',
                controller: 'CreateEditAutomationRuleModalController',
                size: 'lg',
                resolve: {
                    rAutomationRule: function() {
                        return newRule;
                    },
                    rClients: function() {
                        return $scope.clients;
                    },
                    rVehicleTypes: function() {
                        return $scope.vehicleTypes;
                    },
                    rDriverTypes: function() {
                        return $scope.driverTypes;
                    },
                    rMode: function() {
                        return 'CREATE';
                    },
                    rLinkedDriverTypes: function() {
                        return null;
                    },
                }
            });
        }

        function openExclusionsModal(rule) {
            
            rule.exclusionRules = $scope.exclusionRules.filter(function(item) {
                return item.BiddingFilterId == rule.Id;
            })
            $modal.open({
                templateUrl: '/webapp/management/settings/company/auction-config/modals/create-edit-exclusion.partial.html',
                controller: 'CreateEditExclusionRuleModalController',
                size: 'lg',
                resolve: {
                    rAutomationRule: function() {
                        return rule;
                    }
                }
            });
        }

        function editAutomationRule(automationRule) {
            $modal.open({
                templateUrl: '/webapp/management/settings/company/auction-config/modals/create-edit.partial.html',
                controller: 'CreateEditAutomationRuleModalController',
                size: 'lg',
                resolve: {
                    rAutomationRule: function() {
                        return automationRule;
                    },
                    rAutoAllocationRule: function() {
                        return null;
                    },
                    rClients: function() {
                        return $scope.clients;
                    },
                    rVehicleTypes: function() {
                        return $scope.vehicleTypes;
                    },
                    rDriverTypes: function() {
                        return $scope.driverTypes;
                    },
                    rMode: function() {
                        return 'EDIT';
                    },
                    rLinkedDriverTypes: ['$http', '$config', function ($http, $config) {
                        return $http({
                            method: 'GET',
                            url: $config.API_ENDPOINT + '/api/Bid/rule-linked-driverTypes?ruleId=' + automationRule.Id
                        }).then(function successCallback(response) {
                            return response.data;
                        }, function errorCallback(error) {
                            swal("Error", "There was some error trying to fetch the driver types.", "error");
                        });
                    }],
                }
            });
        }

        function ChangeAuctionBiddingSetting() {
            if (!$scope.companyBiddingConfig.EnableBidding)
                $scope.companyBiddingConfig.EnableAuctionBidding = false;
        }
    }
}(angular))