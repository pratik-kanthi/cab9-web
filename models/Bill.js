(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Bill', 'api/bill', {
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
            DriverId: {
                type: String,
                displayField: 'Driver._Fullname',
                table: {
                    hidden: true
                },
                display: 'Driver'
            },
            Driver: {
                type: ['Driver'],
                ref: 'Driver',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            ReceivedDate: {
                type: moment,
                display: 'Received Date',
                displayFilters: " | companyDate:'DD/MM/YYYY'"
            },
            DueDate: {
                type: moment,
                display: 'Due Date',
                displayFilters: " | companyDate:'DD/MM/YYYY'"
            },
            Reference: {
                type: String
            },
            Notes: {
                type: String
            },
            Discount: {
                type: Number
            },


            BookingsSubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            BookingsTaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            ExtrasSubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            ExtrasTaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            WaitingSubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            WaitingTaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            AdjustmentsSubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            AdjustmentsTaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            DiscountTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            SubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            TaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            TotalAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            PaymentsTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            BillPayments: {
                type: ['BillPayment'],
                ref: 'BillPayment',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
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
    }
})(angular);