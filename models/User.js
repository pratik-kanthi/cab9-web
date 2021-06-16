(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);

    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('User', 'api/account', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            UserName: {
                type: String
            },
            Email: {
                type: String
            },
            Claims: {
                type: ['Claim'],
                ref: 'Claim',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            AccessFailedCount: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            LockoutEnabled: {
                type: Boolean,
                binding: function(item) {
                     if (item.LockoutEnabled == true)
                         return 'Yes';
                     else if (item.LockoutEnabled == false)
                         return 'No';
                     else
                         return '';
                 },
                table: {
                    visible: false
                }
            },
            LockoutEndDateUtc: {
                type: moment,
                table: {
                    hidden: true
                }
            },
            PhoneNumber: {
                type: "Phone",
                table: {
                    hidden: true
                }
            },
            Name: {
                type: String
            },
            ImageUrl: {
                type: String,
                hidden: true,
            },
            _ImageUrl: {
                type: String,
                table: {
                    //                    htmlBinding: true,
                    //                    binding: function (item) {
                    //                        return '<image src="' + item._ImageUrl + '" style="width:50px;height:50px;" />';
                    //                    }
                    hidden: true
                },
                calculated: function () {
                    if (this.ImageUrl && this.ImageUrl.trim() != "") {
                        if (this.ImageUrl.slice(0, 4) == 'http') {
                            return this.ImageUrl;
                        } else {
                            return window.resourceEndpoint + this.ImageUrl;
                        }
                    } else {
                        return window.endpoint + 'api/imagegen?text=' + (this.Name || '').replace(/ /g, "+");
                    }
                }
            },
            UserType: {
                type: String,
                calculated: function () {
                    var type = "";
                    if (!this.Claims) {
                        return "";
                    }
                    for (var i = 0; i < this.Claims.length; i++) {
                        if (this.Claims[i].ClaimType == 'DriverId') {
                            type += 'Driver';
                        } else if (this.Claims[i].ClaimType == 'ClientId') {
                            type += 'Client'
                        } else if (this.Claims[i].ClaimType == 'PassengerId') {
                            type += 'Passenger'
                        } else if (this.Claims[i].ClaimType == 'StaffId') {
                            type += 'Staff'
                        }
                    }
                    return type;
                },
                display: 'User Type'
            },
            CreationTime: {
                type: moment,
                display: 'Creation Time',
                table: {
                    hidden: true
                }
            },
            ModificationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            CreationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ModificationTime: {
                type: moment,
                display: 'Modification Time',
                table: {
                    hidden: true
                }
            }
        });

        ModelProvider.registerSchema('UserInfo', 'api/account/formatted', {
            Id: {
                type: String,
                editable: false,
                table: {
                    visible: false
                }
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            UserName: {
                type: String
            },
            Name: {
                type: String
            },
            Type: {
                type: String,
                display: 'User Type'
            },
            Client: {
                type: String,
                display: 'Clients',
                htmlBinding: true,
                binding: function() {
                    return '<span style="white-space:pre;">{{$row.Client}}</span>'
                }
            },
            Email: {
                type: String,
                table: {
                    visible: false
                }
            },
            EmailConfirmed: {
                type: Boolean,
                display: 'Verified'
            },
            LockoutEndDateUtc: {
                type: moment,
                table: {
                    hidden: true
                }
            },
            ImageUrl: {
                type: String,
                hidden: true,
            },
            _ImageUrl: {
                type: String,
                table: {
                    hidden: true
                },
                calculated: function () {
                    if (this.ImageUrl && this.ImageUrl.trim() != "") {
                        if (this.ImageUrl.slice(0, 4) == 'http') {
                            return this.ImageUrl;
                        } else {
                            return window.resourceEndpoint + this.ImageUrl;
                        }
                    } else {
                        return window.endpoint + 'api/imagegen?text=' + (this.Name || '').replace(/ /g, "+");
                    }
                }
            },
            TypeId: {
                type: String,
                table: {
                    hidden: true
                }
            }
        });

    }
})(angular);