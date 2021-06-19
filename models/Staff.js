(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Staff', 'api/staff', {
            Id: {
                type: String,
                editable: false,
                required: true,
                validators: [],
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            StaffRoleId: {
                type: String,
                required: true,
                displayField: 'StaffRole.Name',
                table: {
                    hidden: true
                }
            },
            StaffRole: {
                type: 'StaffRole',
                ref: 'StaffRole',
                refBy: 'StaffRoleId',
                table: {
                    hidden: true
                }
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
            Nationality: {
                type: String,
                table: {
                    visible: false
                }
            },
            DateOfBirth: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
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
                    visible: false
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
                    visible: false
                },
                display: 'Full Address'
            },
            Phone: {
                type: "Phone"
            },
            Mobile: {
                type: "Phone"
            },
            Fax: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            Email: {
                type: String
            },
            StartDate: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                defaultValue: new moment().toDate(),
                table: {
                    visible: false
                }
            },
            EndDate: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                required: false,
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
            ImageUrl: {
                type: String,
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
    }
})(angular);