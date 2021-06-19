(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientItemWebBookerSettingsController', clientItemWebBookerSettingsController);
    module.controller('ImageModalController', imageModalController);

    clientItemWebBookerSettingsController.$inject = ['$scope', '$stateParams', '$state', '$q', '$config', '$UI', 'Model', 'rSettings','$modal'];

    function clientItemWebBookerSettingsController($scope, $stateParams, $state, $q, $config, $UI, Model, rSettings, $modal) {
        $scope.setting = rSettings[0] ? rSettings[0] : new Model.ClientWebBookerSetting();
        $scope.chooseImage = chooseImage;
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        $scope.displayMode = 'VIEW';
        $scope.counter = 1;

        function chooseImage() {
            return $modal.open({
                templateUrl: '/webapp/common/views/clients/webBookerSettings/modal/modal.html',
                controller: 'ImageModalController',
                backdrop: 'static',
                resolve: {
                    rSetting: function () {
                        return $scope.setting;
                    }
                }
            }).result.then(function (res) {
                $scope.setting.WelcomeHeroImage = res;
                $scope.counter++;
            }, function (result) {});
        };

        function startEdit() {
            $scope.displayMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.setting.$rollback(false);
            $scope.displayMode = 'VIEW';
        }

        function saveEdits() {
            if ($scope.setting && !$scope.setting.Id) {
                $scope.setting.ClientId = $stateParams.Id;
                $scope.setting.$save().success(function () {
                    swal({
                        title: "Web Booker Settings Saved.",
                        text: "Changes have been saved.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $state.go('root.clients.viewer.webbookersettings', null, {
                        reload: true
                    });
                });
            }
            else {
                $scope.setting.$patch().success(function () {
                    swal({
                        title: "Web Booker Settings Saved.",
                        text: "Changes have been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $scope.displayMode = 'VIEW';
                });
            }
        }
    }

    imageModalController.$inject = ['$scope', '$http', '$config', '$modalInstance', 'rSetting', '$UI'];
    function imageModalController($scope, $http, $config, $modalInstance, rSetting, $UI) {
        $scope.upload = {
            choosen: null,
            src: null,
            dimensions: null,
            minWidth: 1024,
            minHeight: 768,
            uploadFull: function () {
                var fd = new FormData();
                fd.append('file', $scope.upload.choosen);
                $http.post($config.API_ENDPOINT + 'api/ClientWebBookerSettings', fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    },
                    params: {
                        id: rSetting.Id
                    }
                }).success(function (data) {
                    swal({
                        title: "Web Booker Image Uploaded",
                        text: "The web booker image has been uploaded and will be displayed on your company's login page. You may have to refresh the page to view the changes.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $modalInstance.close(data);
                }).error(function (err) {
                    swal({
                        title: "Image Upload Error",
                        text: "There was some error while trying to upload the image.",
                        type: "error"
                    });
                    console.log(arguments);
                });
            }
        }

        $scope.$watch('upload.choosen.name + upload.choosen.size', function (newvalue) {
            $scope.upload.src = null
            if (!newvalue) {
                $scope.upload.src = null;
            } else {
                var img = new Image();
                var reader = new FileReader();
                img.onload = function () {
                    if ($scope.upload.minWidth) {
                        if (img.width < $scope.upload.minWidth || img.height< $scope.upload.minHeight) {
                            swal("Warning", "Image Size not optimised. Minimum 1024 x 768px", "warning");
                            return;
                        } 
                    }
                    reader.onload = function (e) {
                        $scope.upload.src = e.target.result;
                        $scope.$apply();
                    }
                    reader.readAsDataURL($scope.upload.choosen);
                }
                img.src = window.URL.createObjectURL($scope.upload.choosen);
            }
        }, true);
    }
}(angular))