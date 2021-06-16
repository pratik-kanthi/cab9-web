(function (angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsRolesController', SettingsRolesController);

    SettingsRolesController.$inject = ['$scope', '$filter', '$config', '$http', 'rRoles', 'rPermissions', 'Model'];

    function SettingsRolesController($scope, $filter, $config, $http, rRoles, rPermissions, Model) {
        $scope.roles = rRoles;
        $scope.permissions = $filter('orderBy')(rPermissions, 'Name');
        $scope.calcLeft = calcLeft;
        $scope.expand = expand;
        $scope.retract = retract;
        $scope.toggle = toggle;
        $scope.getPermissionClassForRole = getPermissionClassForRole;
        $scope.togglePermissionForRole = togglePermissionForRole;
        $scope.saveChanges = saveChanges;
        $scope.addNewRole = addNewRole;


        angular.forEach($scope.permissions, function (p) {
            var split = p.Name.split('.');
            p.$show = !(split.length > 1);
            //p.$active = $scope.roles.Permissions.filter(function (per) { return per.Id == p.Id }).length > 0;
            p.$childs = $scope.permissions.filter(function (per) {
                return per.Name.indexOf(p.Name) == 0 && per.Name != p.Name;
            });
        });

        function calcLeft(p) {
            var split = p.split('.');
            return (25 + (10 * (split.length - 1))) + 'px';
        }

        function expand(p) {
            var origLength = p.Name.split('.').length;
            angular.forEach(p.$childs, function (per) {
                var split = per.Name.split('.');
                per.$show = !(split.length > origLength + 1);
            });
            p.$expand = true;
        }

        function retract(p) {
            angular.forEach(p.$childs, function (per) {
                per.$show = false;
            });
            p.$expand = false;
        }

        function toggle(p) {
            if (p.$expand) {
                retract(p);
            } else {
                expand(p);
            }
        }

        function addNewRole() {
            swal({
                title: "New Role",
                text: "Enter the name of the role below.",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                inputPlaceholder: "Role Name"
            }, function (inputValue) {
                if (inputValue === false) {
                    return false;
                }
                if (inputValue === "") {
                    swal.showInputError("Enter role name!");
                    return false;
                }
                if (inputValue) {
                    var role = new Model.StaffRole();
                    role.Name = inputValue;
                    role.Description = inputValue;
                    role.Permissions = "[]";
                    role.$save().then(function () {
                        swal("New Role Added", "New role has been added, please configure the new role after the refresh.", "success");
                        location.reload();
                    });
                    return true;
                }
            });
        }

        function getPermissionClassForRole(p, r, pr) {
            if (r.Name == "Super Admin" || r.Id == 1) return 'glyphicon-ok text-success';

            var hasExact = false;
            var value = null;
            if (r.Permissions) {
                r.Permissions.forEach(function (perm, ind) {
                    if (perm.hasOwnProperty(p.Name)) {
                        value = perm[p.Name][pr];
                        hasExact = true;
                        return;
                    }
                });
            }
            if (!hasExact) {
                return 'glyphicon-remove text-danger';
            } else {
                if (value) {
                    var allChildren = p.$childs.every(function (child) {
                        return r.Permissions.filter(function (c) {
                            if (c.hasOwnProperty(child.Name)) return c[child.Name][pr]
                        }).length == 1;
                    });
                    if (allChildren) {
                        return 'glyphicon-ok text-success';
                    } else {
                        return 'glyphicon-ok text-warning';
                    }
                } else {
                    return 'glyphicon-remove text-danger';
                }
            }
        }

        function togglePermissionForRole(p, role, pr) {
            if (role.Name == "Super Admin" || !role.TenantId) return;

            var hasAlready = false;
            var value = null;
            var ind = -1;
            if (!role.Permissions)
                role.Permissions = [];
            role.Permissions.forEach(function (perm, i) {
                if (perm.hasOwnProperty(p.Name)) {
                    value = perm[p.Name][pr];
                    hasAlready = true;
                    ind = i;
                }
            })

            if (hasAlready) {
                //toggle off
                var hasAllChildren = getPermissionClassForRole(p, role, pr);
                role.Permissions[ind][p.Name][pr] = !value;

                if (pr == 'R') {
                    if (hasAllChildren != 'glyphicon-remove text-danger') {
                        //all childs off
                        role.Permissions[ind][p.Name]['W'] = false;
                        role.Permissions[ind][p.Name]['D'] = false;
                        p.$childs.forEach(function (child) {
                            var obj = role.Permissions.filter(function (per) {
                                return (per.hasOwnProperty(child.Name))
                            })[0];
                            var index = role.Permissions.indexOf(obj);
                            if (index != -1) {
                                role.Permissions[index][child.Name][pr] = false;
                                role.Permissions[index][child.Name]['W'] = false;
                                role.Permissions[index][child.Name]['D'] = false;
                            }
                        })
                    } else {
                        //update parent permissions
                        getParentPermissions(p).forEach(function (per) {
                            var par = role.Permissions.filter(function (pa) {
                                return (pa.hasOwnProperty(per.Name))
                            })[0];
                            var index = role.Permissions.indexOf(par);
                            if (index != -1)
                                role.Permissions[index][per.Name][pr] = !value;
                        });
                    }
                } else {
                    if (!value) {
                        if (!role.Permissions[ind][p.Name]['R'])
                            role.Permissions[ind][p.Name]['R'] = !value;
                        if (pr == 'D')
                            role.Permissions[ind][p.Name]['W'] = !value;

                        //update parent permissions
                        getParentPermissions(p).forEach(function (per) {
                            var par = role.Permissions.filter(function (pa) {
                                return (pa.hasOwnProperty(per.Name))
                            })[0];
                            var index = role.Permissions.indexOf(par);
                            if (index != -1)
                                role.Permissions[index][per.Name]['R'] = !value;
                        });
                    }
                }
            } else {
                var obj = {};
                var key = p.Name;
                var r = false;
                var w = false;
                var d = false;
                switch (pr) {
                case 'R':
                    obj[key] = {
                        'R': true,
                        'W': false,
                        'D': false
                    };
                    break;
                case 'W':
                    obj[key] = {
                        'R': true,
                        'W': true,
                        'D': false
                    };
                    break;
                case 'D':
                    obj[key] = {
                        'R': true,
                        'W': true,
                        'D': true
                    };
                    break;
                default:
                    break;
                }
                role.Permissions.push(obj);
                obj = {};
                getParentPermissions(p).forEach(function (per) {
                    var par = role.Permissions.filter(function (pa) {
                        return (pa.hasOwnProperty(per.Name))
                    })[0];
                    var index = role.Permissions.indexOf(par);
                    if (index == -1) {
                        key = per.Name;
                        obj[key] = {
                            'R': true,
                            'W': false,
                            'D': false
                        };
                        role.Permissions.push(obj);
                    } else {
                        role.Permissions[index][per.Name]['R'] = true;
                    }
                });
            }
        }

        function getParentPermissions(p) {
            var parents = [];
            var split = p.Name.split('.');
            var test = '';
            for (var i = 0; i < split.length; i++) {
                if (test.length > 0) test += '.';
                test += split[i];
                var found = $scope.permissions.filter(function (per) {
                    return per.Name == test
                });
                if (found[0]) {
                    parents.push(found[0]);
                }
            }
            return parents;
        }

        function saveChanges() {
            var copy = angular.copy($scope.roles);
            angular.forEach(copy, function (r) {
                r.Permissions = JSON.stringify(r.Permissions);
            });
            $http.post($config.API_ENDPOINT + 'api/CurrentPermissions', copy).success(function (d) {
                swal("Updated", "Roles have been updated", "success");
            });
        }
    }
}(angular));