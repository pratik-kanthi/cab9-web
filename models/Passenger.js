(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Passenger', 'api/passengers', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Firstname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Surname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            _Fullname: {
                type: String,
                sort: ['Firstname', 'Surname'],
                reqColumns: ['Firstname', 'Surname'],
                calculated: function() {
                    return (this.Firstname + ' ' + this.Surname);
                },
                display: 'Full Name'
            },
            ClientId: {
                type: String,
                displayField: 'Client.Name',
                table: {
                    hidden: true
                }
            },
            Client: {
                type: 'Client',
                ref: 'Client',
                refBy: 'ClientId',
                table: {
                    hidden: true
                }
            },
            _ClientName: {
                type: String,
                sort: ['Client/Name'],
                reqColumns: ['ClientId', 'Client/Name'],
                calculated: function() {
                    if (this.ClientId && this.Client)
                        return this.Client.Name;
                },
                display: 'Client Name'
            },
            Phone: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            Mobile: {
                type: "Phone",
                required: true
            },
            VIP: {
                type: Boolean
            },
            Fax: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            Email: {
                type: String,
                table: {
                    visible: false
                }
            },
            Active: {
                type: Boolean,
                defaultValue: true,
                table: {
                    hidden: true
                }
            },
            Notes: {
                type: String,
                textarea: 5,
                table: {
                    hidden: true
                }
            },
            ImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Tags: {
                type: ['Tag'],
                ref: 'Tag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            CreationTime: {
                type: moment
                //hidden: true
            },
            _Addresses: {
                type: String,
                sort: ['Id'],
                reqColumns: ['Addresses'],
                binding: function(data) {
                    if (data.Addresses && data.Addresses.length > 0) {
                        var _add = "";
                        for (var i = 0; i < data.Addresses.length; i++) {
                            var str = data.Addresses[i].StopSummary;
                            _add += str + "<span></span>"
                        }
                        return _add;
                    } else {
                        return ''
                    }
                },
                display: 'Addresses',
                htmlBinding: true,
                table: {
                    visible: false
                }
            },
            DefaultVehicleTypeId: {
                type: String,
                display: 'Default Vehicle Type',
                table: {
                    hidden: true
                }
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    if (this.ImageUrl) {
                        if (this.ImageUrl.slice(0, 4) == 'http') {
                            return this.ImageUrl;
                        } else {
                            return window.resourceEndpoint + this.ImageUrl;
                        }
                    } else {
                        return window.endpoint + 'api/imagegen?text=' + (this.Firstname || '').replace(/ /g, "+");
                    }
                }
            },
            Addresses: {
                type: ['PassengerAddress'],
                ref: 'PassengerAddress',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            BannedDrivers: {
                type: ['Driver'],
                ref: 'Driver',
                refType: 'ManyToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            ScoreOverall: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ScoreBooking: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ScoreRevenue: {
                type: Number,
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
            },
            Invited: {
                type: Boolean,
                defaultValue: false,
                display:'Invited to App',
                table: {
                    visible: false
                }
            }
        });

        ModelProvider.registerSchema('PassengerProfile', '', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Firstname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Surname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            _Fullname: {
                type: String,
                calculated: function() {
                    return (this.Firstname + ' ' + this.Surname);
                },
                display: 'Full Name'
            },
            ClientId: {
                type: String,
                displayField: 'Client.Name',
                table: {
                    hidden: true
                }
            },
            Client: {
                type: 'Client',
                ref: 'Client',
                refBy: 'ClientId',
                table: {
                    hidden: true
                }
            },
            Phone: {
                type: "Phone",
            },
            Mobile: {
                type: "Phone",
                required: true
            },
            Email: {
                type: String,
            },
            ImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Bookings: {
                type: Number
            },
            Notes: {
                type: String,
                textarea: 5
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function() {
                    if (this.ImageUrl) {
                        if (this.ImageUrl.slice(0, 4) == 'http') {
                            return this.ImageUrl;
                        } else {
                            return window.resourceEndpoint + this.ImageUrl;
                        }
                    } else {
                        return window.endpoint + 'api/imagegen?text=' + (this.Firstname || '').replace(/ /g, "+");
                    }
                }
            }
        });
    }
})(angular);