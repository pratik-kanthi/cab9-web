(function (angular) {
    var module = angular.module('cab9.common');
    module.controller('CreateWebBookerController', createWebBookerController);
    createWebBookerController.$inject = ['$scope', '$config', '$http', '$q', 'Auth', 'Model', '$filter', '$UI', '$modalInstance'];

    function createWebBookerController($scope, $config, $http, $q, Auth, Model, $filter, $UI, $modalInstance) {
        $scope.webbooker = {};
        $scope.webbooker.SecretKey = randomSecretKey(16);
        $scope.fetchedClients = [];
        $scope.fetchedBookers = [];

        $scope.searchClients = searchClients;
        $scope.searchBookers = searchBookers;
        $scope.save = save;

        $scope.clients = [];
        $scope.bookers = [];
        $scope.templates = [];

        //fetch templates
        $http.get($config.WEBBOOKER_ENDPOINT + 'getTemplates').then(function (response) {
            $scope.templates = response.data;
        }, function () {
            swal({
                title: "Error",
                text: "Error occurred while fetching WebBooker Templates",
                type: "error",
                confirmButtonColor: $UI.COLOURS.brandSecondary
            });
        });

        Model.Client
            .query()
            .select('Id,Name,ImageUrl')
            .orderBy('Name')
            .trackingEnabled()
            .execute().then(function (data) {
                $scope.clients = data;
            });

        function randomSecretKey(length) {
            var lower = "abcdefghijklmnopqrstuvwxyz";
            var upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var numbers = "1234567890";
            var totalAvailable = lower + upper + numbers;

            var result = "";

            for (var i = 0; i < length; i++) {
                result += totalAvailable.charAt(Math.floor(Math.random() * 62));
            }
            result += upper.charAt(Math.floor(Math.random() * 26));
            result += lower.charAt(Math.floor(Math.random() * 26));
            result += numbers.charAt(Math.floor(Math.random() * 10));

            var pass = result.split('').sort(function () {
                return 0.5 - Math.random()
            }).join('');

            return pass
        }

        function searchClients(searchText) {
            if (searchText && searchText.length > 2) {
                $scope.fetchedClients = $filter('filter')($scope.clients, {
                    Name: searchText
                });
            } else {
                $scope.fetchedClients = [];
            }
        }

        function searchBookers(searchText) {
            if (searchText && searchText.length > 2) {
                $scope.fetchedBookers = $filter('filter')($scope.bookers, {
                    Firstname: searchText
                });
            } else {
                $scope.fetchedBookers = [];
            }
        }

        $scope.$watch('webbooker', function (newvalue, oldvalue) {
            if (newvalue && newvalue.DefaultClientId && newvalue.DefaultClientId !== oldvalue.DefaultClientId) {
                Model.ClientStaff.query()
                    .filter("ClientId eq guid'" + newvalue.DefaultClientId + "'")
                    .select('Id,Active,Firstname, Surname, Phone,ClientStaffRole/Name')
                    .include('ClientStaffRole')
                    .orderBy('Firstname')
                    .execute().then(function (data) {
                        $scope.bookers = data;
                    });
            }
        }, true);

        function save() {
            $scope.webbooker.TenantId = Auth.getSession().TenantId.toUpperCase();
            $scope.webbooker.BrandColors.Light = $UI.COLOURS.light;
            $scope.webbooker.BrandColors.Dark = $UI.COLOURS.dark;
            $scope.webbooker.BrandColors.Grey = $UI.COLOURS.grey;
            $scope.webbooker.RequestUrl = $config.API_ENDPOINT;
            $http.post($config.WEBBOOKER_ENDPOINT + 'api/tenant', $scope.webbooker).then(function (response) {
                swal({
                    title: "Saved",
                    text: "Web Booker Settings have been saved",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $modalInstance.close(response.data);

            }, function (error) {
                swal({
                    title: "Error",
                    text: error.data ? error.data : "Error occurred while saving WebBooker Data",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })

        }
    }
}(angular));