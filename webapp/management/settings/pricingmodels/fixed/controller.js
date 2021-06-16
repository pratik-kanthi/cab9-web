(function (angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsPricingModelsFixedController', SettingsPricingModelsFixedController);
    SettingsPricingModelsFixedController.$inject = ['$scope', '$UI', '$q', '$state', '$stateParams', 'Model', 'rFixedCount', 'rFixeds', 'rVehicleTypes', 'rZones', '$http', '$config', '$modal'];
    function SettingsPricingModelsFixedController($scope, $UI, $q, $state, $stateParams, Model, rFixedCount, rFixeds, rVehicleTypes, rZones, $http, $config, $modal) {
        console.log(Date.now());
        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 50,
            totalResults: null,
            maxPages: null
        };
        $scope.disabled = false;
        $scope.paging.totalResults = rFixedCount.length;
        $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
        $scope.setPage = setPage;
        $scope.filter = filter;
        $scope.fixeds = rFixeds.data ? rFixeds.data : [];
        $scope.zones = rZones;
        setTimeout(function(){
            console.log(Date.now());
        },0);

        for (i = 0; i < $scope.fixeds.length; i++) {
            if ($scope.fixeds[i].FixedPrice != undefined || $scope.fixeds[i].FixedPrice != null)
                $scope.fixeds[i].FixedPrice = $scope.fixeds[i].FixedPrice.toFixed(2);
            $scope.fixeds[i].delete = false;
            if ($scope.fixeds[i].FromId != null) {
                $scope.fixeds[i].$SelectedFrom = $scope.zones.find(function (z) {
                    return z.Id == $scope.fixeds[i].FromId;
                });
            }
            else {
                $scope.fixeds[i].$SelectedFrom = $scope.fixeds[i].FromPostcode;
            }
            if ($scope.fixeds[i].ToId != null) {
                $scope.fixeds[i].$SelectedTo = $scope.zones.find(function (z) {
                    return z.Id == $scope.fixeds[i].ToId;
                });
            }
            else {
                $scope.fixeds[i].$SelectedTo = $scope.fixeds[i].ToPostcode;
            }
        }

        $scope.vehicleTypes = rVehicleTypes;
        $scope.startNew = startNew;
        $scope.saveNew = saveNew;
        $scope.remove = remove;
        $scope.getVehicleTypeCost = getVehicleTypeCost;
        $scope.setVehicleTypeCost = setVehicleTypeCost;
        $scope.startImport = startImport;
        $scope.deleteSelected = deleteSelected;
        $scope.deleteAll = deleteAll;
        $scope.cancelDelete = cancelDelete;
        $scope.saveChanges = saveChanges;
        $scope.cancelNewEdit = cancelNewEdit;
        $scope.getSelectedRow = getSelectedRow;
        $scope.export = exportList;
        $scope.showDeleteCheckbox = false;
        $scope.addNew = false;
        $scope.selectedDropdownItem = null;

        for (i = 0; i < $scope.zones.length; i++) {
            var x = $scope.zones[i];
            x.readableName = $scope.zones[i].Name;
        }

        $scope.dropdownItems = $scope.zones;
        $scope.text = "Text";

        $scope.filterObjectList = function (userInput) {
            var filter = $q.defer();
            var normalisedInput = userInput.toLowerCase();

            var filteredArray = $scope.dropdownItems.filter(function (item) {
                var match = item.Name.toLowerCase().indexOf(normalisedInput) === 0;
                return match;
            });

            filter.resolve(filteredArray);
            return filter.promise;
        };

        $scope.prices = [];
        $scope._pindex = 0;

        function cancelDelete() {
            for (i = 0; i < $scope.fixeds.length; i++)
                $scope.fixeds[i].delete = false;

            $scope.showDeleteCheckbox = false;
            $scope.selectAll = false;
        }

        function exportList() {
            window.open($config.API_ENDPOINT + 'api/PricingModels/export?id=' + $stateParams.Id);
        }

        function saveChanges(fixed) {
            $scope.disabled = true;
            if (fixed.Id) {
                $http.post($config.API_ENDPOINT + 'api/PricingModels/updatefixed', fixed)
                    .then(function () {
                        $scope.disabled = false;
                        //location.reload();
                        angular.forEach($scope.fixeds, function (f) {
                            f.delete = false;
                            if (f.FromId != null) {
                                f.$SelectedFrom = $scope.zones.find(function (z) {
                                    return z.Id == f.FromId;
                                });
                            }
                            else {
                                f.$SelectedFrom = f.FromPostcode;
                            }
                            if (f.ToId != null) {
                                f.$SelectedTo = $scope.zones.find(function (z) {
                                    return z.Id == f.ToId;
                                });
                            }
                            else {
                                f.$SelectedTo = f.ToPostcode;
                            }
                        });
                    }, function () {
                        $scope.disabled = false;
                        console.log("Error occured");
                    });
            }
        }

        function deleteAll() {
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover fixed pricing!",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            }, function () {
                $http.post($config.API_ENDPOINT + 'api/PricingModels/deleteAllfixed?pricingModelId=' + $scope.item.Id).then(function () {
                    swal('Deleted Successfully', 'Fixed Prices deleted successfully', 'success');
                    location.reload();
                }, function () {
                    swal('Delete Error', 'An error occured', 'error');
                });
            });
        }

        function deleteSelected() {
            var selected = [];
            if($scope.selectAll) {
                selected = $scope.fixeds;
            } else {
                selected = $scope.fixeds.filter(function (fixed) {
                    return fixed.delete == true;
                });
            }
            
            var selectedIds = selected.map(function(item) {
                return item.Id
            });

            $scope.showDeleteCheckbox = !$scope.showDeleteCheckbox;
            if (selected.length > 0) {
                swal({
                    title: "Are you sure?",
                    text: "You will not be able to recover selected fixed pricing!",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: true
                }, function () {
                    $http.post($config.API_ENDPOINT + 'api/PricingModels/deleteselectedfixed', selectedIds).then(function () {
                        $scope.fixeds = $scope.fixeds.filter(function (fixed) {
                            return fixed.delete == false;
                        });
                        $scope.showDeleteCheckbox = false;
                        $scope.selectAll = false;
                        swal('Deleted Successfully', 'Fixed Prices deleted successfully', 'success');
                        location.reload();
                    }, function () {
                        $scope.showDeleteCheckbox = true;
                        $scope.selectAll = false;
                        swal('Delete Error', 'An error occured', 'error');
                    });
                });
            }
        }

        function startImport() {
            $modal.open({
                templateUrl: '/webapp/management/clients/item/fixed/import.modal.html',
                controller: ['$scope', '$config', '$q', 'Auth', '$http', '$state', '$modalInstance', function ($scope, $config, $q, Auth, $http, $state, $modalInstance) {
                    $scope.import = {
                        stage: 'UPLOAD',
                        modelId: $stateParams.Id,
                        file: null,
                        status: '',
                        percent: 0,
                        preview: null
                    };
                    var importing = false;

                    $scope.validateFile = validateFile;
                    $scope.importFile = importFile;
                    $scope.decrement = function () {
                        console.log("Hey!");
                    };

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
                            $scope.import.hasWarnings = data.Rows.filter(function (x) { return x.Warnings.length > 0 }).length > 0;
                            if (!$scope.import.hasErrors && !$scope.import.hasWarnings) {
                                importFile().then(function () {
                                    $modalInstance.close();
                                });
                            } else {
                                swal({
                                    type: 'error',
                                    title: 'Error validating file',
                                    text: 'Would you like to view the errors?',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, show me the errors.'
                                }, function () {
                                    $modalInstance.close();
                                    $state.go('root.settings.import.model-prices', {
                                        progress: $scope.import
                                    });
                                });
                            }
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

                    function importFile() {
                        if ($scope.import.pressed) return;
                        $scope.import.pressed = true;

                        return $http.post($config.API_ENDPOINT + 'api/Import/ModelFixed/Confirm', {
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
                }]
            }).result.then(function () {
                filter();
            });
        }

        function getSelectedRow($index) {
            $scope.selectedIndexForDeletion = $index;
        }

        $scope.filters = {
            fromZone: null,
            toZone: null,
            fromPostcode: null,
            toPostcode: null
        }

        function cancelNewEdit() {
            $scope.addNew = false;
            $scope.newfixed = null;
        }

        function startNew() {
            $scope.addNew = true;
            $scope.newfixed = new Model.PricingFixed();
            $scope.newfixed.PricingModelId = $scope.item.Id;
        }

        function saveNew(newfixed) {
            if (newfixed.FromId == null && (newfixed.FromPostcode == null || newfixed.FromPostcode.length < 2)) {
                swal('Error', 'Please select either a From Zone or enter a valid Postcode Prefix', 'error');
                return;
            }

            if (newfixed.ToId == null && (newfixed.ToPostcode == null || newfixed.ToPostcode.length < 2)) {
                swal('Error', 'Please select either a To Zone or enter a valid Postcode Prefix', 'error');
                return;
            }

            saveDetails(newfixed);

            function saveDetails(newfixed) {
                newfixed.FixedPrice = parseFloat(newfixed.FixedPrice)

                if (newfixed.VehicleTypes && newfixed.VehicleTypes.length == 0) {
                    newfixed.VehicleTypes = null;
                }

                $http.post($config.API_ENDPOINT + 'api/PricingModels/addNewFixed', newfixed)
                    .then(function (response) {
                        $scope.addNew = false;
                        $scope.disabled = false;
                        $scope.fixeds.push(response.data)
                        $scope.newfixed = null;

                        angular.forEach($scope.fixeds, function (f) {
                            var vts = f.VehicleTypes.map(function (v) { return new Model.VehicleTypeInPricingFixed(v); });
                            f.VehicleTypes.length = 0;
                            [].push.apply(f.VehicleTypes, vts);
                            f.delete = false;
                            if (f.FromId != null) {
                                f.$SelectedFrom = $scope.zones.find(function (z) {
                                    return z.Id == f.FromId;
                                });
                            }
                            else {
                                f.$SelectedFrom = f.FromPostcode;
                            }
                            if (f.ToId != null) {
                                f.$SelectedTo = $scope.zones.find(function (z) {
                                    return z.Id == f.ToId;
                                });
                            }
                            else {
                                f.$SelectedTo = f.ToPostcode;
                            }
                        });
                        return;
                    }, function () {
                        $scope.disabled = false;
                        console.log("Error occured");
                        return;
                    });

            }
        }

        function filter() {
            var query = Model.PricingFixed.query()
                .select('Id')
                .parseAs(function (data) {
                    this.Id = data.Id;
                })
                .filter('PricingModelId', 'eq', "guid'" + $stateParams.Id + "'");

            if ($scope.filters.fromZone && $scope.filters.fromZone != "")
                query.filter("FromId eq guid'" + $scope.filters.fromZone + "'")
            if ($scope.filters.toZone && $scope.filters.toZone != "")
                query.filter("ToId eq guid'" + $scope.filters.toZone + "'")
            if ($scope.filters.fromPostcode && $scope.filters.fromPostcode != "")
                query.filter("FromPostcode eq'" + $scope.filters.fromPostcode + "'")
            if ($scope.filters.toPostcode && $scope.filters.toPostcode != "")
                query.filter("ToPostcode eq '" + $scope.filters.toPostcode + "'")

            query.execute().then(function (response) {
                $scope.paging.totalResults = response.length;
                $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                setPage(1);
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function setPage(page) {
            $scope.paging.currentPage = page;

            var queryString = 'api/PricingModels/FetchFixedDetails?PricingModelId=' + $stateParams.Id + '&count=' + $scope.paging.resultsPerPage + '&pageNum=' + page;
            if ($scope.filters.fromZone && $scope.filters.fromZone != "")
                queryString = queryString + '&FromId=' + $scope.filters.fromZone;

            if ($scope.filters.toZone && $scope.filters.toZone != "")
                queryString = queryString + '&ToId=' + $scope.filters.toZone;

            if ($scope.filters.fromPostcode && $scope.filters.fromPostcode != "")
                queryString = queryString + '&FromPostcode=' + $scope.filters.fromPostcode;

            if ($scope.filters.toPostcode && $scope.filters.toPostcode != "")
                queryString = queryString + '&ToPostcode=' + $scope.filters.toPostcode;

            $http.get($config.API_ENDPOINT + queryString).then(function (response) {
                $scope.fixeds = response.data;
                if (response.data.length > 0) {
                    $scope.fixeds = response.data.map(function (x) {
                        return new Model.PricingFixed(x);
                    });
                    angular.forEach($scope.fixeds, function (f) {
                        var vts = f.VehicleTypes.map(function (v) { return new Model.VehicleTypeInPricingFixed(v); });
                        f.VehicleTypes.length = 0;
                        [].push.apply(f.VehicleTypes, vts);
                        f.delete = false;
                        if (f.FromId != null) {
                            f.$SelectedFrom = $scope.zones.find(function (z) {
                                return z.Id == f.FromId;
                            });
                        }
                        else {
                            f.$SelectedFrom = f.FromPostcode;
                        }
                        if (f.ToId != null) {
                            f.$SelectedTo = $scope.zones.find(function (z) {
                                return z.Id == f.ToId;
                            });
                        }
                        else {
                            f.$SelectedTo = f.ToPostcode;
                        }
                    });
                }
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });


        }

        function remove($index) {
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover this fixed pricing!",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            }, function () {
                $scope.fixeds[$index].$delete()
                    .success(function () {
                        $scope.fixeds.splice($index, 1);
                    }).error(function () {

                    });
            });
        }

        function getVehicleTypeCost(fixed, vt) {
            if (fixed != undefined && fixed.VehicleTypes != null) {
                var typePricing = fixed.VehicleTypes.filter(function (v) {
                    return v.VehicleTypeId == vt.Id;
                })[0];
                if (typePricing) {
                    return typePricing.FixedPrice.toFixed(2);
                } else {
                    return null;
                }
            }
        }

        function setVehicleTypeCost(fixed, vt, value) {
            if (fixed != undefined && fixed.VehicleTypes != null && fixed.Id != undefined) {
                fixed.VehicleTypes = fixed.VehicleTypes || [];
                var typePricing = fixed.VehicleTypes.filter(function (v) {
                    return v.VehicleTypeId == vt.Id;
                })[0];
                if (typePricing) {
                    typePricing.FixedPrice = parseFloat(value);
                } else if (value) {
                    var n = new Model.VehicleTypeInPricingFixed();
                    n.VehicleTypeId = vt.Id;
                    n.PricingFixedId = fixed.Id;
                    n.FixedPrice = parseFloat(value);
                    fixed.VehicleTypes.push(n);
                }
                saveChanges(fixed);
            }
            else if (fixed.Id == undefined) {
                var n = new Model.VehicleTypeInPricingFixed();
                n.VehicleTypeId = vt.Id;
                n.PricingFixedId = fixed.Id;
                n.FixedPrice = parseFloat(value);

                if (fixed.VehicleTypes == undefined)
                    fixed.VehicleTypes = [];

                var _existing = fixed.VehicleTypes.find(function (elem, i) {
                    return elem.VehicleTypeId == vt.Id;
                });

                if (_existing == undefined) {
                    fixed.VehicleTypes.push(n);
                } else {
                    var index = fixed.VehicleTypes.indexOf(_existing);
                    fixed.VehicleTypes[index].FixedPrice = parseFloat(value);
                }
            }
        }
    }
})(angular)