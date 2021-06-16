(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('ClientStaff', 'api/ClientStaff', {
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
            ClientStaffRoleId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            ClientStaffRole: {
                type: 'ClientStaffRole',
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
            _ClientStaffRole: {
                type: String,
                sort: ['ClientStaffRole/Name'],
                reqColumns: ['ClientStaffRole/Name'],
                calculated: function() {
                    return this.ClientStaffRole && this.ClientStaffRole.Name;
                },
                display: 'Client Staff Role',
                table: {
                    visible: false
                }
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
            DateOfBirth: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
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
                display: 'Client Name',
                table: {
                    hidden: true
                }
            },
            Phone: {
                type: "Phone"
            },
            AllPassengers: {
                type: Boolean,
                table: {
                    hidden: true
                }
            },
            _AllPassengers: {
                type: String,
                sort: ['AllPassengers'],
                reqColumns: ['AllPassengers'],
                calculated: function() {
                    if (this.AllPassengers)
                        return "Yes";
                    else
                        return "No";
                },
                table: {
                    visible: false
                },
                display: 'All Passengers'
            },

            Mobile: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            Fax: {
                type: "Phone",
                table: {
                    hidden: true
                }
            },
            Email: {
                type: String
            },
            Active: {
                type: Boolean,
                defaultValue: true,
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
            Passengers: {
                type: ['Passenger'],
                ref: 'Passenger',
                refType: 'ManyToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            CreationTime: {
                type: moment,
                hidden: true
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
            },
            ScoreOverall: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            Address1: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Address2: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Area: {
                type: String,
                table: {
                    hidden: true
                }
            },
            TownCity: {
                type: String,
                display: 'Town/City',
                table: {
                    hidden: true
                }
            },
            County: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Postcode: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Country: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Latitude: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            Longitude: {
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
            _FullAddress: {
                type: String,
                sort: ['Address1',
                    'Address2',
                    'Area',
                    'TownCity',
                    'Postcode',
                    'County',
                    'Country'
                ],
                reqColumns: ['Address1',
                    'Address2',
                    'Area',
                    'TownCity',
                    'Postcode',
                    'County',
                    'Country'
                ],
                calculated: function() {
                    var summary = '';
                    summary += this.Address1 ? (this.Address1 + '\n') : '';
                    summary += this.Address2 ? (this.Address2 + '\n') : '';
                    summary += this.Area ? (this.Area + '\n') : '';
                    summary += this.TownCity ? (this.TownCity + '\n') : '';
                    summary += this.Postcode ? (this.Postcode + '\n') : '';
                    summary += this.County ? (this.County + '\n') : '';
                    summary += this.Country ? this.Country : '';
                    return summary;
                },
                table: {
                    hidden: true
                },
                display: 'Full Address'
            }
        });
    }
})(angular);