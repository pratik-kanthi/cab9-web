(function (angular) {
    var module = angular.module('cab9.settings.import', ['cab9.settings']);
    var currencyIcon = '£';
    module.config(moduleConfig);
    module.controller('ImportSettingsController', ImportSettingsController);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions', 'ModelProvider'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions, ModelProvider) {
        if (!$permissions.test('settings.import')) return;
        $stateProvider.state('root.settings.import', {
            url: '/import',
            permission: 'Settings - Import',
            resolve: {
                rTabs: [
                    function () {
                        return [{
                            heading: 'Bookings',
                            route: 'root.settings.import.bookings'
                        }, {
                            heading: 'Client Fixed Prices',
                            route: 'root.settings.import.client-prices'
                        }, {
                            heading: 'Driver Fixed Prices',
                            route: 'root.settings.import.driver-prices'
                        }, {
                            heading: 'Pricing Model Fixed Prices',
                            route: 'root.settings.import.model-prices'
                        }]
                    }
                ]
            },
            views: {
                'settings-content@root.settings': {
                    templateUrl: '/webapp/management/settings/import/partial.html',
                    controller: 'ImportSettingsController'
                }
            }
        });

        $stateProvider.state('root.settings.import.bookings', {
            url: '/bookings',
            views: {
                'import-view@root.settings.import': {
                    templateUrl: '/webapp/management/settings/import/bookings/partial.html',
                    controller: ['$scope', '$config', '$q', 'Auth', '$http', function ($scope, $config, $q, Auth, $http) {
                        $scope.import = {
                            stage: 'UPLOAD',
                            file: null,
                            status: '',
                            percent: 0,
                            preview: null
                        };
                        var importing = false;
                        $scope.validateFile = validateFile;
                        $scope.importFile = importFile;
                        $scope.hasErrors = function (row, field) {
                            return row.Errors.filter(function (x) { return x.Field == field; }).length > 0;
                        }
                        $scope.hasWarnings = function (row, field) {
                            return row.Warnings.filter(function (x) { return x.Field == field; }).length > 0;
                        }

                        function importFile() {
                            if ($scope.import.pressed) return;
                            $scope.import.pressed = true;

                            $http.post($config.API_ENDPOINT + 'api/Import/Bookings/Confirm', {
                                filename: $scope.import.filename
                            }).then(function () {
                                swal('Import Success', 'rows imported successfully', 'success');
                                $scope.import = {
                                    stage: 'UPLOAD',
                                    file: null,
                                    status: '',
                                    percent: 0,
                                    preview: null
                                };
                            }, function () {
                                swal('Import Error', 'An error occured during import', 'error');
                            });
                        }

                        function validateFile() {
                            if (!$scope.import.file || importing) {
                                return;
                            }
                            if (!$scope.import.file.name.endsWith(".csv")) {
                                swal('Upload Error', "CSV files only, file should end with '.csv'.", 'error');
                                return;
                            }
                            importing = true;
                            $scope.import.status = 'Uploading ' + $scope.import.file.name;
                            upload($scope.import.file).then(onSuccess, onError, onUpdate);

                            function onSuccess(data) {
                                $scope.import.status = "Bookings Imported!"
                                $scope.import.filename = data.FileName;
                                $scope.import.preview = data.Rows;
                                $scope.import.stage = 'VALIDATE'
                                $scope.import.hasErrors = data.Rows.filter(function (x) { return x.Errors.length > 0 }).length > 0;

                                swal('Imported', "Bookings imported", 'success');
                            }

                            function onError() {
                                $scope.import.status = "Error Uploading";

                                swal('Error', "Bookings import failed.", 'error');
                            }

                            function onUpdate(val) {
                                $scope.import.percent = val;
                                if (val == 100) {
                                    $scope.import.percent = null;
                                    $scope.import.status = "Processing";
                                }
                            }
                        }

                        function upload(file) {
                            var deferred = $q.defer();

                            var fd = new FormData();
                            fd.append('file', file);
                            var xhr = new XMLHttpRequest();
                            xhr.upload.onprogress = function (e) {
                                $scope.$apply(function () {
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
                            xhr.open('POST', $config.API_ENDPOINT + 'api/Import/Bookings/Valdate', true);
                            xhr.setRequestHeader("Authorization", "Bearer " + Auth.getSession().access_token);
                            xhr.setRequestHeader("Accept-Type", "application/json");
                            xhr.send(fd);

                            return deferred.promise;
                        }
                    }],
                }
            }
        });

        $stateProvider.state('root.settings.import.client-prices', {
            url: '/client-prices',
            params: {
                progress: null
            },
            views: {
                'import-view@root.settings.import': {
                    templateUrl: '/webapp/management/settings/import/clientFixed/partial.html',
                    controller: ['$scope', '$config', '$q', 'Auth', '$http', '$stateParams', function ($scope, $config, $q, Auth, $http, $stateParams) {
                        $scope.import = $stateParams.progress || {
                            stage: 'UPLOAD',
                            clientId: null,
                            file: null,
                            status: '',
                            percent: 0,
                            preview: null
                        };
                        $scope.clients = [];


                        var importing = false;
                        $scope.validateFile = validateFile;
                        $scope.importFile = importFile;
                        $scope.hasErrors = hasErrors;
                        $scope.hasWarnings = hasWarnings;
                        $scope.searchClients = searchClients;

                        function hasErrors(row, field) {
                            return row.Errors.filter(function (x) { return x.Field == field; }).length > 0;
                        }

                        function hasWarnings(row, field) {
                            return row.Warnings.filter(function (x) { return x.Field == field; }).length > 0;
                        }

                        function searchClients(searchText) {
                            if (!searchText)
                                return;

                            $scope.loadingClients = true;

                            $http.get($config.API_ENDPOINT + "api/Clients/Search", {
                                params: {
                                    searchText: searchText,
                                    lite: true
                                }
                            }).then(function (response) {
                                $scope.clients = [];
                                for (var i = 0; i < response.data.length; i++) {
                                    var item = response.data[i];
                                    $scope.clients.push({
                                        Id: item.Id,
                                        Name: "(" + item.AccountNo + ") " + item.Name,
                                        Description: ((item.ClientType && item.ClientType.Name) ? item.ClientType.Name : ''),
                                    });
                                }
                                $scope.loadingClients = false;
                            });
                        }

                        function importFile() {
                            if ($scope.import.pressed) return;
                            $scope.import.pressed = true;

                            $http.post($config.API_ENDPOINT + 'api/Import/ClientFixed/Confirm', {
                                filename: $scope.import.filename,
                                clientId: $scope.import.clientId
                            }).then(function () {
                                swal('Import Success', 'rows imported successfully', 'success');
                                $scope.import = {
                                    stage: 'UPLOAD',
                                    clientId: null,
                                    file: null,
                                    status: '',
                                    percent: 0,
                                    preview: null
                                };
                            }, function () {
                                swal('Import Error', 'An error occured during import', 'error');
                            });
                        }

                        function validateFile() {
                            if (!$scope.import.file || importing) {
                                return;
                            }
                            if (!$scope.import.file.name.endsWith(".csv")) {
                                swal('Upload Error', "CSV files only, file should end with '.csv'.", 'error');
                                return;
                            }
                            importing = true;
                            $scope.import.status = 'Uploading ' + $scope.import.file.name;
                            upload($scope.import.file).then(onSuccess, onError, onUpdate);

                            function onSuccess(data) {
                                $scope.import.status = "File Uploaded!"
                                $scope.import.filename = data.FileName;
                                $scope.import.preview = data.Rows;
                                $scope.import.stage = 'VALIDATE'
                                $scope.import.hasErrors = data.Rows.filter(function (x) { return x.Errors.length > 0 }).length > 0;

                                swal('Uploaded', "Upload Successful.", 'success');
                            }

                            function onError() {
                                $scope.import.status = "Error Uploading";

                                swal('Error', "Import Failed.", 'error');
                            }

                            function onUpdate(val) {
                                $scope.import.percent = val;
                                if (val == 100) {
                                    $scope.import.percent = null;
                                    $scope.import.status = "Processing";
                                }
                            }
                        }

                        function upload(file) {
                            var deferred = $q.defer();

                            var fd = new FormData();
                            fd.append('file', file);
                            var xhr = new XMLHttpRequest();
                            xhr.upload.onprogress = function (e) {
                                $scope.$apply(function () {
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
                            xhr.open('POST', $config.API_ENDPOINT + 'api/Import/ClientFixed/Valdate?clientId=' + $scope.import.clientId, true);
                            xhr.setRequestHeader("Authorization", "Bearer " + Auth.getSession().access_token);
                            xhr.setRequestHeader("Accept-Type", "application/json");
                            xhr.send(fd);

                            return deferred.promise;
                        }
                    }],
                }
            }
        });

        $stateProvider.state('root.settings.import.model-prices', {
            url: '/model-prices',
            params: {
                progress: null
            },
            views: {
                'import-view@root.settings.import': {
                    templateUrl: '/webapp/management/settings/import/modelFixed/partial.html',
                    controller: ['$scope', '$config', '$q', 'Auth', '$http', '$stateParams', 'Model', function ($scope, $config, $q, Auth, $http, $stateParams, Model) {
                        $scope.import = $stateParams.progress || {
                            stage: 'UPLOAD',
                            modelId: null,
                            file: null,
                            status: '',
                            percent: 0,
                            preview: null
                        };
                        $scope.models = [];
                        Model.PricingModel.query()
                            .select("Id,Name,Description")
                            .parseAs(function (i) {
                                return {
                                    Id: i.Id,
                                    Name: i.Name,
                                    Description: i.Description
                                }
                            })
                            .execute().then(function (data) {
                                $scope.models = data;
                            });


                        var importing = false;
                        $scope.validateFile = validateFile;
                        $scope.importFile = importFile;
                        $scope.hasErrors = hasErrors;
                        $scope.hasWarnings = hasWarnings;

                        function hasErrors(row, field) {
                            return row.Errors.filter(function (x) { return x.Field == field; }).length > 0;
                        }

                        function hasWarnings(row, field) {
                            return row.Warnings.filter(function (x) { return x.Field == field; }).length > 0;
                        }

                        function importFile() {
                            if ($scope.import.pressed) return;
                            $scope.import.pressed = true;

                            $http.post($config.API_ENDPOINT + 'api/Import/ModelFixed/Confirm', {
                                filename: $scope.import.filename,
                                modelId: $scope.import.modelId
                            }).then(function () {
                                swal('Import Success', 'rows imported successfully', 'success');
                                $scope.import = {
                                    stage: 'UPLOAD',
                                    clientId: null,
                                    file: null,
                                    status: '',
                                    percent: 0,
                                    preview: null
                                };
                            }, function () {
                                swal('Import Error', 'An error occured during import', 'error');
                            });
                        }

                        function validateFile() {
                            if (!$scope.import.file || importing) {
                                return;
                            }
                            if (!$scope.import.file.name.endsWith(".csv")) {
                                swal('Upload Error', "CSV files only, file should end with '.csv'.", 'error');
                                return;
                            }
                            importing = true;
                            $scope.import.status = 'Uploading ' + $scope.import.file.name;
                            upload($scope.import.file).then(onSuccess, onError, onUpdate);

                            function onSuccess(data) {
                                $scope.import.status = "File Uploaded!"
                                $scope.import.filename = data.FileName;
                                $scope.import.preview = data.Rows;
                                $scope.import.stage = 'VALIDATE'
                                $scope.import.hasErrors = data.Rows.filter(function (x) { return x.Errors.length > 0 }).length > 0;

                                swal('Uploaded', "Upload Successful.", 'success');
                            }

                            function onError() {
                                $scope.import.status = "Error Uploading";

                                swal('Error', "Import Failed.", 'error');
                            }

                            function onUpdate(val) {
                                $scope.import.percent = val;
                                if (val == 100) {
                                    $scope.import.percent = null;
                                    $scope.import.status = "Processing";
                                }
                            }
                        }

                        function upload(file) {
                            var deferred = $q.defer();

                            var fd = new FormData();
                            fd.append('file', file);
                            var xhr = new XMLHttpRequest();
                            xhr.upload.onprogress = function (e) {
                                $scope.$apply(function () {
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
                            xhr.open('POST', $config.API_ENDPOINT + 'api/Import/ModelFixed/Valdate?modelId=' + $scope.import.modelId, true);
                            xhr.setRequestHeader("Authorization", "Bearer " + Auth.getSession().access_token);
                            xhr.setRequestHeader("Accept-Type", "application/json");
                            xhr.send(fd);

                            return deferred.promise;
                        }
                    }],
                }
            }
        });

        $stateProvider.state('root.settings.import.driver-prices', {
            url: '/driver-prices',
            params: {
                progress: null
            },
            views: {
                'import-view@root.settings.import': {
                    templateUrl: '/webapp/management/settings/import/driverFixed/partial.html',
                    controller: ['$scope', '$config', '$q', 'Auth', '$http', '$stateParams', 'Model', function ($scope, $config, $q, Auth, $http, $stateParams, Model) {
                        $scope.import = $stateParams.progress || {
                            stage: 'UPLOAD',
                            modelId: null,
                            file: null,
                            status: '',
                            percent: 0,
                            preview: null
                        };
                        $scope.models = [];
                        Model.DriverPaymentModel.query()
                            .select("Id,Name,Description")
                            .parseAs(function (i) {
                                return {
                                    Id: i.Id,
                                    Name: i.Name,
                                    Description: i.Description
                                }
                            })
                            .execute().then(function (data) {
                                $scope.models = data;
                            });


                        var importing = false;
                        $scope.validateFile = validateFile;
                        $scope.importFile = importFile;
                        $scope.hasErrors = hasErrors;
                        $scope.hasWarnings = hasWarnings;

                        function hasErrors(row, field) {
                            return row.Errors.filter(function (x) { return x.Field == field; }).length > 0;
                        }

                        function hasWarnings(row, field) {
                            return row.Warnings.filter(function (x) { return x.Field == field; }).length > 0;
                        }

                        function importFile() {
                            if ($scope.import.pressed) return;
                            $scope.import.pressed = true;

                            $http.post($config.API_ENDPOINT + 'api/Import/DriverFixed/Confirm', {
                                filename: $scope.import.filename,
                                modelId: $scope.import.modelId
                            }).then(function () {
                                swal('Import Success', 'rows imported successfully', 'success');
                                $scope.import = {
                                    stage: 'UPLOAD',
                                    clientId: null,
                                    file: null,
                                    status: '',
                                    percent: 0,
                                    preview: null
                                };
                            }, function () {
                                swal('Import Error', 'An error occured during import', 'error');
                            });
                        }

                        function validateFile() {
                            if (!$scope.import.file || importing) {
                                return;
                            }
                            if (!$scope.import.file.name.endsWith(".csv")) {
                                swal('Upload Error', "CSV files only, file should end with '.csv'.", 'error');
                                return;
                            }
                            importing = true;
                            $scope.import.status = 'Uploading ' + $scope.import.file.name;
                            upload($scope.import.file).then(onSuccess, onError, onUpdate);

                            function onSuccess(data) {
                                $scope.import.status = "File Uploaded!"
                                $scope.import.filename = data.FileName;
                                $scope.import.preview = data.Rows;
                                $scope.import.stage = 'VALIDATE'
                                $scope.import.hasErrors = data.Rows.filter(function (x) { return x.Errors.length > 0 }).length > 0;

                                swal('Uploaded', "Upload Successful.", 'success');
                            }

                            function onError() {
                                $scope.import.status = "Error Uploading";

                                swal('Error', "Import Failed.", 'error');
                            }

                            function onUpdate(val) {
                                $scope.import.percent = val;
                                if (val == 100) {
                                    $scope.import.percent = null;
                                    $scope.import.status = "Processing";
                                }
                            }
                        }

                        function upload(file) {
                            var deferred = $q.defer();

                            var fd = new FormData();
                            fd.append('file', file);
                            var xhr = new XMLHttpRequest();
                            xhr.upload.onprogress = function (e) {
                                $scope.$apply(function () {
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
                            xhr.open('POST', $config.API_ENDPOINT + 'api/Import/DriverFixed/Valdate?modelId=' + $scope.import.modelId, true);
                            xhr.setRequestHeader("Authorization", "Bearer " + Auth.getSession().access_token);
                            xhr.setRequestHeader("Accept-Type", "application/json");
                            xhr.send(fd);

                            return deferred.promise;
                        }
                    }],
                }
            }
        });

    }

    ImportSettingsController.$inject = ['$scope', 'rTabs', '$http', '$config', 'Auth'];

    function ImportSettingsController($scope, rTabs, $http, $config, Auth) {
        $scope.tabDefs = rTabs;
    }
}(angular));
