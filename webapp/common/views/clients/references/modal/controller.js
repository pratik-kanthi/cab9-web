(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientItemReferenceCreateController', clientItemReferenceCreateController);

    clientItemReferenceCreateController.$inject = ['$scope', '$stateParams', '$modalInstance', '$rootScope', '$state', '$q', '$config', '$UI', '$http', 'Model'];

    function clientItemReferenceCreateController($scope, $stateParams, $modalInstance, $rootScope, $state, $q, $config, $UI, $http, Model) {
        $scope.reference = new Model.ClientReference();
        $scope.reference.$File = null;
        $scope.reference.$data = null;
        $scope.reference.$KnownValues = "";
        $scope.upload = upload;
        $scope.save = save;
        $scope.viewMode = 'CREATE';
        $scope.testMask = testMask;
        //        $scope.$watch('reference.$data', function () {
        //            if ($scope.$$phase != '$apply' && $scope.$$phase != '$digest')
        //                $scope.$apply();
        //        })
        
        $scope.progress = null;

        function testMask(mask) {
            try {
                $scope.reference.$testReg = _validateMask(mask);
            } catch (e) {
                return true;
            }
            return false;
        }

        function _validateMask(mask) {
            var lower = '[a-z]';
            var upper = '[A-Z]';
            var numeric = '[0-9]';
            var regString = '^';
            var currentCase = 0;
            var mandatoryChar = false;
            var quoted = false;
            for (var i = 0; i < mask.length; i++) {
                var c = mask[i];
                if (c === "'") {
                    if (quoted) {
                        regString += ')';
                    } else {
                        regString += '(';
                    }
                    quoted = !quoted;
                } else if (quoted) {
                    if (['.'].indexOf(c) != -1) {
                        c = '\\' + c;
                    }
                    regString += c;
                } else if (c === '>') {
                    currentCase++;
                    if (currentCase > 1) {
                        throw 'Bad Mask - Case blocks have consecutive > without ending previous block';
                    }
                } else if (c === '<') {
                    currentCase--;
                    if (currentCase < -1) {
                        throw 'Bad Mask - Case blocks have consecutive < without ending previous block';
                    }
                } else if (c === '0') {
                    mandatoryChar = true;
                    regString += '(' + numeric + ')';
                } else if (c === '9') {
                    regString += '(' + numeric + '?)';
                } else if (currentCase === 1) {
                    if (c === 'A') {
                        mandatoryChar = true;
                        regString += '(' + upper + '|' + numeric + ')';
                    } else if (c === 'a') {
                        regString += '(' + upper + '?|' + numeric + '?)';
                    } else if (c === 'L') {
                        mandatoryChar = true;
                        regString += '(' + upper + ')';
                    } else if (c === 'l') {
                        regString += '(' + upper + '?)';
                    }
                } else if (currentCase === 0) {
                    if (c === 'A') {
                        mandatoryChar = true;
                        regString += '(' + lower + '|' + upper + '|' + numeric + ')';
                    } else if (c === 'a') {
                        regString += '(' + lower + '?|' + upper + '?|' + numeric + '?)';
                    } else if (c === 'L') {
                        mandatoryChar = true;
                        regString += '(' + lower + '|' + upper + ')';
                    } else if (c === 'l') {
                        regString += '(' + lower + '?|' + upper + '?)';
                    }
                } else if (currentCase === -1) {
                    if (c === 'A') {
                        mandatoryChar = true;
                        regString += '(' + lower + '|' + numeric + ')';
                    } else if (c === 'a') {
                        regString += '(' + lower + '?|' + numeric + '?)';
                    } else if (c === 'L') {
                        mandatoryChar = true;
                        regString += '(' + lower + ')';
                    } else if (c === 'l') {
                        regString += '(' + lower + '?)';
                    }
                }
            }
            if (quoted) {
                throw 'Bad Mask - Quoted section not terminated';
            }
            if (!mandatoryChar) {
                throw 'Bad Mask - Must contain at least 1 mandatory symbol (A, L, 0)';
            }
            regString += '$';
            return new RegExp(regString);
        }

        function save() {
            var clientId = $stateParams.Id ? $stateParams.Id : $rootScope.CLIENTID;
            $scope.reference.ClientId = clientId;
            if ($scope.reference.ReferenceType == 'List' && !$scope.reference.$manualEntry) {
                upload();
            } else {
                $scope.reference.$save().success(function () {
                    $modalInstance.close();
                    swal({
                        title: "Client Reference Created.",
                        text: "Changes have been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                }).error(function () {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
            }
        }

        function upload() {
            var clientId = $stateParams.Id ? $stateParams.Id : $rootScope.CLIENTID;
            if (!$scope.reference.$file) {
                swal({
                    title: "File not available.",
                    text: "Please upload a csv file.",
                    type: "warning",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            } else {
                $scope.progress = 0;
                var fd = new FormData();

                fd.append('file', $scope.reference.$file);
                var xhr = new XMLHttpRequest();
                xhr.upload.onprogress = function (e) {
                    if (e.lengthComputable) {
                        $scope.progress = Math.round(e.loaded / e.total * 100);
                        if ($scope.$$phase != '$apply' && $scope.$$phase != '$digest')
                            $scope.$apply();
                    }
                }
                xhr.onload = function (e) {
                    if (e.target.readyState == 4) {
                        if (e.target.status == 200) {
                            $modalInstance.close();
                            swal({
                                title: "Client Reference Created.",
                                text: "Changes have been updated.",
                                type: "success",
                                confirmButtonColor: $UI.COLOURS.brandSecondary
                            });
                            $state.go($state.current, {
                                Id: clientId
                            }, {
                                reload: true
                            });
                        } else {
                            $scope.progress = null;
                            swal({
                                title: "Some Error Occured.",
                                text: "Some error has occured.",
                                type: "error",
                                confirmButtonColor: $UI.COLOURS.brandSecondary
                            });
                        }
                    }
                }
                xhr.onerror = function (e) {
                    $scope.progress = null;
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                }
                xhr.onabort = function (e) {
                    $scope.progress = null;
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                }
                xhr.open('POST', $config.API_ENDPOINT + 'api/clientreferences?ClientId=' + clientId + "&ReferenceName=" + $scope.reference.ReferenceName + "&Mandatory=" + $scope.reference.Mandatory, true);
                xhr.setRequestHeader("Authorization", "Bearer " + $rootScope.$$access_token);
                xhr.setRequestHeader("Accept-Type", "application/json");
                xhr.send(fd);
            }
        }
    }
    module.controller('ClientItemReferenceEditController', clientItemReferenceEditController);

    clientItemReferenceEditController.$inject = ['$scope', '$stateParams', '$modalInstance', '$rootScope', '$state', '$q', '$config', '$UI', '$http', 'Model', 'rReference'];

    function clientItemReferenceEditController($scope, $stateParams, $modalInstance, $rootScope, $state, $q, $config, $UI, $http, Model, rReference) {
        $scope.reference = rReference[0];
        $scope.selected = {
            action: ""
        };
        $scope.actions = ["Replace CSV", "Add Known Values", "Delete Known Values", "Validate Known Value"];
        $scope.reference.$File = null;
        $scope.reference.$data = null;
        $scope.progress = null;
        $scope.reference.$KnownValues = "";
        $scope.viewMode = 'EDIT';
        $scope.upload = upload;
        $scope.validate = validate;
        $scope.valid = '';
        $scope.testMask = testMask;
        $scope.save = save;

        function addValues() {
            var values = $scope.reference.$KnownValues.replace(/\r\n/g, ',').replace(/\n/g, ',');
            $http.post($config.API_ENDPOINT + "/api/clientreferences/add?ClientReferenceId=" + $scope.reference.Id + "&ClientReferenceKnownValue=" + values).then(function (response) {
                $modalInstance.close()
                swal({
                    title: "Client Reference Updated.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function deleteValues() {
            var values = $scope.reference.$KnownValues.replace('\r\n', ',').replace('\n', ',');
            $http.post($config.API_ENDPOINT + "/api/clientreferences/delete?ClientReferenceId=" + $scope.reference.Id + "&ClientReferenceKnownValue=" + values).then(function (response) {
                $modalInstance.close()
                var deleted = 0;
                var notfound = 0;
                for (i = 0, len = response.data.length; i < len; i++) {
                    if (response.data[i].Status == "Deleted")
                        deleted++;
                    else
                        notfound++;
                }
                swal({
                    title: "Client Reference Updated.",
                    text: "Deleted:" + deleted + " Not Found:" + notfound,
                    type: "success",
                    showConfirmButton: true,
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function save() {
            var clientId = $stateParams.Id ? $stateParams.Id : $rootScope.CLIENTID;
            $scope.reference.ClientId = clientId;
            $scope.reference.$patch().success(function () {
                if ($scope.reference.ReferenceType == 'List') {
                    upload();
                } else {
                    $modalInstance.close();
                    swal({
                        title: "Client Reference Updated.",
                        text: "Changes have been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                }
            }).error(function () {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
            
        }


        function validate() {
            $http.post($config.API_ENDPOINT + "/api/clientreferences/validate?ClientReferenceId=" + $scope.reference.Id + "&ReferenceValue=" + $scope.reference.$KnownValues).then(function (response) {
                $scope.valid = 'valid';
            }, function (err) {
                if (err.status == 404) {
                    $scope.valid = 'invalid';
                    return
                } else
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
            })
        }

        function testMask(mask) {
            try {
                $scope.reference.$testReg = _validateMask(mask);
            } catch (e) {
                return true;
            }
            return false;
        }

        function _validateMask(mask) {
            var lower = '[a-z]';
            var upper = '[A-Z]';
            var numeric = '[0-9]';
            var regString = '^';
            var currentCase = 0;
            var mandatoryChar = false;
            var quoted = false;
            for (var i = 0; i < mask.length; i++) {
                var c = mask[i];
                if (c === "'") {
                    if (quoted) {
                        regString += ')';
                    } else {
                        regString += '(';
                    }
                    quoted = !quoted;
                } else if (quoted) {
                    if (['.'].indexOf(c) != -1) {
                        c = '\\' + c;
                    }
                    regString += c;
                } else if (c === '>') {
                    currentCase++;
                    if (currentCase > 1) {
                        throw 'Bad Mask - Case blocks have consecutive > without ending previous block';
                    }
                } else if (c === '<') {
                    currentCase--;
                    if (currentCase < -1) {
                        throw 'Bad Mask - Case blocks have consecutive < without ending previous block';
                    }
                } else if (c === '0') {
                    mandatoryChar = true;
                    regString += '(' + numeric + ')';
                } else if (c === '9') {
                    regString += '(' + numeric + '?)';
                } else if (currentCase === 1) {
                    if (c === 'A') {
                        mandatoryChar = true;
                        regString += '(' + upper + '|' + numeric + ')';
                    } else if (c === 'a') {
                        regString += '(' + upper + '?|' + numeric + '?)';
                    } else if (c === 'L') {
                        mandatoryChar = true;
                        regString += '(' + upper + ')';
                    } else if (c === 'l') {
                        regString += '(' + upper + '?)';
                    }
                } else if (currentCase === 0) {
                    if (c === 'A') {
                        mandatoryChar = true;
                        regString += '(' + lower + '|' + upper + '|' + numeric + ')';
                    } else if (c === 'a') {
                        regString += '(' + lower + '?|' + upper + '?|' + numeric + '?)';
                    } else if (c === 'L') {
                        mandatoryChar = true;
                        regString += '(' + lower + '|' + upper + ')';
                    } else if (c === 'l') {
                        regString += '(' + lower + '?|' + upper + '?)';
                    }
                } else if (currentCase === -1) {
                    if (c === 'A') {
                        mandatoryChar = true;
                        regString += '(' + lower + '|' + numeric + ')';
                    } else if (c === 'a') {
                        regString += '(' + lower + '?|' + numeric + '?)';
                    } else if (c === 'L') {
                        mandatoryChar = true;
                        regString += '(' + lower + ')';
                    } else if (c === 'l') {
                        regString += '(' + lower + '?)';
                    }
                }
            }
            if (quoted) {
                throw 'Bad Mask - Quoted section not terminated';
            }
            if (!mandatoryChar) {
                throw 'Bad Mask - Must contain at least 1 mandatory symbol (A, L, 0)';
            }
            regString += '$';
            return new RegExp(regString);
        }

        function upload(file, document) {
            var clientId = $stateParams.Id ? $stateParams.Id : $rootScope.CLIENTID;
            if ($scope.selected.action == "Add Known Values") {
                addValues();
                return;
            } else if ($scope.selected.action == "Delete Known Values") {
                deleteValues();
                return;
            } else if (!$scope.reference.$file && $scope.selected.action == "Replace CSV") {
                swal({
                    title: "Please upload a file",
                    text: "Or Select different action",
                    type: "warning",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                return;
            } else if ($scope.selected.action == "Replace CSV") {
                $scope.progress = 0;
                var fd = new FormData();
                fd.append('file', $scope.reference.$file);
                var xhr = new XMLHttpRequest();
                xhr.upload.onprogress = function (e) {
                    if (e.lengthComputable) {
                        $scope.progress = Math.round(e.loaded / e.total * 100);
                        if ($scope.$$phase != '$apply' && $scope.$$phase != '$digest')
                            $scope.$apply();
                    }
                }
                xhr.onload = function (e) {
                    if (e.target.readyState == 4) {
                        if (e.target.status == 200) {
                            $modalInstance.close();
                            swal({
                                title: "Client Reference Updated.",
                                text: "Changes have been updated.",
                                type: "success",
                                confirmButtonColor: $UI.COLOURS.brandSecondary
                            });
                            $state.go($state.current, {
                                Id: $stateParams.Id
                            }, {
                                reload: true
                            });
                        } else {
                            $scope.progress = null;
                            swal({
                                title: "Some Error Occured.",
                                text: "Some error has occured.",
                                type: "error",
                                confirmButtonColor: $UI.COLOURS.brandSecondary
                            });
                        }
                    }
                }
                xhr.onerror = function (e) {
                    $scope.progress = null;
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                }
                xhr.onabort = function (e) {
                    $scope.progress = null;
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                }
                xhr.open('POST', $config.API_ENDPOINT + 'api/clientreferences?ClientId=' + clientId + "&ReferenceName=" + $scope.reference.ReferenceName + "&ClientReferenceId=" + $scope.reference.Id, true);
                xhr.setRequestHeader("Authorization", "Bearer " + $rootScope.$$access_token);
                xhr.setRequestHeader("Accept-Type", "application/json");
                xhr.send(fd);
            } else {
                $modalInstance.close();
                swal({
                    title: "Client Reference Updated.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }
        }
    }
}(angular))