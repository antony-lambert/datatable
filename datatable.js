(function ($) {
    $.fn.datatable = function (settings) {
    	
        //attributes
        var defaultSettings = {
            rowId: null,
            data: null,
            columns: null,
            paging: false,
            pageSize : 10,
            canAdd: false,
            canUpdate: false,
            canDelete: false,
            canCopy: false,
            css: {
                table: 'table table-striped',
                error: 'has-error'
            },
            labels:{
            	add: 'Add',
            	cancel: 'Cancel',
            	save: 'Save',
            	update: 'Update',
            	delete: 'Delete',
            	copy: 'Copy',
            },
            onFieldRender: null,
            onFieldEnable: null,
            onFieldDisable: null,
            onFieldValueChange: null,
            onValidateData: null,
            onInsert: null,
            onUpdate: null,
            onDelete: null
        };

        var $table = null;
        var config = {};
        var startIndex = 0;
        var endIndex = 0;
        var currentPage = 1;

        var ADD_ACTIONS = [
        	{ keyLabel: 'save', trigger: confirmInsertRow },
        	{ keyLabel: 'cancel', trigger: removeNewRow }
        ];

        var UPDATE_ACTIONS = [
        	{ keyLabel: 'save', trigger: confirmUpdateRow },
        	{ keyLabel: 'cancel', trigger: cancelUpdateRow }
        ];

        var UPDATE_ACTION = { keyLabel: 'update', trigger: updateRow };

        var DELETE_ACTION = { keyLabel: 'delete', trigger: deleteRow };

        var COPY_ACTION = { keyLabel: 'copy', trigger: copyRow };

        var ACTIONS = [];
    
        //check configuration
        function checkConfig(){
        	 if(!config.data){ throw 'config.data is required'; }
        	 if(!config.columns){ throw 'config.columns is required'; }
        	 if((config.canAdd || canCopy) && ! config.onInsert) {throw 'if config.canAdd === true or config.canCopy === true, config.onInsert is required'; }
        	 if(config.canUpdate && ! config.onUpdate) {throw 'if config.canUpdate === true, config.onUpdate is required'; }
        	 if(config.canDelete && ! config.onDelete) {throw 'if config.canDelete === true, config.onDelete is required'; }
        }

        //build table
        function buildHeader() {
            var thead = $('<thead>');
            var tr = $('<tr>');

            $.each(config.columns, function (index, column) {
                var th = $('<th>');
                
                if(column.sorting){
                	var spanSort = $('<span>');
                	spanSort.addClass('glyphicon glyphicon-sort-by-attributes');
                	spanSort.click({sortingField: column.field }, function(event){event.preventDefault(); sort(event.data.sortingField);});
                	th.append(spanSort);
                }
                
                if (column.name) {
                    th.append(' ' +column.name);
                } else {
                    th.append(' ' + column.field);
                }

                if (column.width) {
                    th.css('min-width', column.width + 'px');
                }
                
                tr.append(th);
            });

            var thActions = $('<th>');
            tr.append(thActions);

            thead.append(tr);
            $table.append(thead);
        }

        function buildBody() {
        	
        	initPaging();

            var tbody = $table.find('tbody');
            if (tbody.length) {
                tbody.empty();
            } else {
                tbody = $('<tbody>');
                $table.append(tbody);
            }

			for(var i = startIndex; i < endIndex; i++) {
				
				var datarow = config.data[i];
            
                var tr = $('<tr>');
                tr.prop('internalId', i);

                $.each(config.columns, function (index, column) {
                    var td = $('<td>');
                    td.width(column.width + 'px');
                    var htmlContent;
                    if (column.type === 'text') {
                        htmlContent = $('<input class="form-control" type="text" />');
                        htmlContent.val(datarow[column.field]);
                        htmlContent.addClass('disabled');
                        htmlContent.prop('readonly', true);
                    } else {
                        htmlContent = datarow[column.field];
                    }

                    td.html(htmlContent);

                    if (config.onFieldRender) {
                        htmlContent = config.onFieldRender(htmlContent, column.field);
                    }

                    tr.append(td);
                });

				tr.append(generateActions(ACTIONS));
                tbody.append(tr);
            };


        }
        
                function generateActions(actions) {
            var tdActions = $('<td>');
            tdActions.addClass('actions');

            $.each(actions, function (idx, action) {
                var btnAction = $('<button class="btn btn-primary">' + config.labels[action.keyLabel] + '</button>');
                btnAction.click(function (event) {
                    event.preventDefault();
                    action.trigger($(event.target).parent().parent());
                });
                tdActions.append(btnAction);
            });

            return tdActions;
        }

        function buildFooter() {
            var tfoot = $('<tfoot>');

			var trFooter = $('<tr>');
			var tdFooter = $('<td>');
			tdFooter.prop('colspan', config.columns.length + 1);
			
			//pagination
			var ulPagination = $('<ul>');
			ulPagination.addClass('pagination');
			tdFooter.append(ulPagination);
			
			//button add
			var btnAdd = $('<a href=\"javascript:void(0);\"></a>');
			btnAdd.addClass('btn btn-primary pull-right');
			
			var spanAdd = $('<span>&raquo; ' + config.labels.add + '</span>');
			btnAdd.append(spanAdd);
			tdFooter.append(btnAdd);
			
			trFooter.append(tdFooter);
			tfoot.append(trFooter);
			
            $table.append(tfoot);

            $table.find('tfoot .btn').click(function (event) { event.preventDefault(); addNewRow(); });
        }

		//paging
		function initPaging() {
			if (config.paging === false) {
				startIndex = 0;
				endIndex = config.data.length;
			} else {
				startIndex = (currentPage - 1) * config.pageSize;
				endIndex = startIndex + config.pageSize;
				
				if(endIndex > config.data.length){ endIndex = config.data.length;}
			}
		}

		
        function buildPagination() {
        	
        	var ulPagination = $table.find('tfoot ul.pagination');
            ulPagination.empty();

            if (config.paging && config.data.length > 0) {
                
                var liPrevious = $('<li>');
                if(currentPage === 1) { liPrevious.addClass('disabled'); }
                
                var aPrevious = $('<a><span>&laquo;</span></a>');
                if (currentPage > 1) { aPrevious.click(function(event){event.preventDefault(); goToPreviousPage(); }); }
                liPrevious.append(aPrevious);
                ulPagination.append(liPrevious);
                
                var nbPages = Math.ceil(config.data.length / config.pageSize);
                for(var i = 1; i <= nbPages; i++){
                	var li = $('<li>');
                	if(i === currentPage){ li.addClass('active');}
                	
                	var a = $('<a>' + i + '</a>');
                	a.click({idx: i}, function(event){event.preventDefault(); goToPage(event.data.idx);});
                	
                	li.append(a);
                	ulPagination.append(li);
 				}
 				
 				var liNext = $('<li>');
                if( currentPage === nbPages ) { liNext.addClass('disabled'); }
                
 				var aNext = $('<a><span>&raquo;</span></a>');
                if (currentPage < nbPages) { aNext.click(function(event){event.preventDefault(); goToNextPage(); }); }
                liNext.append(aNext);
                ulPagination.append(liNext);
                
 			}
        }
         
		function goToPage(idxPage) {

			if ( currentPage === idxPage) {
				return;
			}
			currentPage = idxPage;
			buildBody();
			buildPagination();
		}

        
        function goToPreviousPage(){
        	goToPage(currentPage -1);
        }
        
        function goToNextPage(){
        	goToPage(currentPage + 1);
        }
        
        //sorting
        function sort(field) {
        	
        	config.data.sort(function (a, b) {
			    if (a[field] > b[field]){
			      return 1;
			    }
			    
			    if (a[field] < b[field]){
			      return -1;
			    }
			    
			    return 0;
			});
			
        	buildBody();
        }

        //new row
        function addNewRow(datarow) {

            var tbody = $table.find('tbody');
            var tr = $('<tr>');
            tr.addClass('newRow');

            $.each(config.columns, function (index, column) {
                var td = $('<td>');

                var htmlContent;
                if (column.type === 'text') {
                    htmlContent = $('<input class="form-control" type="text" />');
                    htmlContent.val(datarow ? datarow[column.field] : '');
                    htmlContent.width(column.width + 'px');
                } else {
                    htmlContent = dataRow ? datarow[column.field] : '';
                }
                if (column.class) {
                    htmlContent.addClass(column.class);
                }
                td.html(htmlContent);

                if (config.onFieldRender) {
                    htmlContent = config.onFieldRender(htmlContent, column.field);
                }

                tr.append(td);
            });

            tr.append(generateActions(ADD_ACTIONS));

            enableRow(tr);

            tbody.append(tr);

            $table.find('tfoot .btn').hide();
        }

        function removeNewRow() {
            $table.find('tbody .newRow').remove();
            $table.find('tfoot .btn').show();
        }

        function confirmInsertRow(row) {

            var datarow = {};

            $.each(config.columns, function (index, column) {
                if (column.type === 'text') {
                    datarow[column.field] = row.find('td:nth-child(' + (index + 1) + ') input').val();
                }
            });
            
            if(!config.onValidateData || config.onValidateData(datarow)){
            	row.removeClass(config.css.error);
            	config.onInsert(row, datarow, doInsert);
            }else{
            	row.addClass(config.css.error);
            }
        }

        function doInsert(row, datarow, success) {
            if (success) {
                config.data.push(datarow);
                removeNewRow();
                buildBody();
                buildPagination();
            }
        }

        //update row
        function updateRow(row) {
            enableRow(row);

            var tdActions = row.find('.actions');
            tdActions.replaceWith(generateActions(UPDATE_ACTIONS));

        }

        function confirmUpdateRow(row) {
            var datarow = config.data[row.prop('internalId')];

            $.each(config.columns, function (index, column) {
                if (column.type === 'text') {
                    datarow[column.field] = row.find('td:nth-child(' + (index + 1) + ') input').val();
                }
            });

			if(!config.onValidateData || config.onValidateData(datarow)){
				row.removeClass(config.css.error);
            	config.onUpdate(row, datarow, doUpdate);
            }else{
            	row.addClass(config.css.error);
            }
        }

        function doUpdate(row, datarow, success) {
            if (success) {
            	config.data[row.prop('internalId')] = datarow;
                buildBody();
                buildPagination();
            }
        }

        function cancelUpdateRow(row) {
        	row.removeClass(config.css.error);
            disableRow(row);

            var data = config.data[row.prop('internalId')];

            $.each(config.columns, function (index, column) {
                if (column.type === 'text') {
                    var field = row.find('td:nth-child(' + (index + 1) + ') input');
                    var value = data[column.field];
                    field.val(value);

                    if (config.onFieldValueChange) {
                        config.onFieldValueChange(field, column.field, value);
                    }
                }
            });

            var tdActions = row.find('.actions');
            tdActions.replaceWith(generateActions(ACTIONS));
        }

        //delete row 
        function deleteRow(row) {

            var datarow = config.data[row.prop('internalId')];

            config.onDelete(row, datarow, doDelete);
        }

        function doDelete(row, datarow, success) {
            if (success) {
            	config.data.splice(row.prop('internalId'), 1);
                buildBody();
                buildPagination();
            }
        }

        //copy row 
        function copyRow(row) {

            var datarow = config.data[row.prop('internalId')];
            if(config.rowId){
            	datarow[config.rowId] = null;
            }
            addNewRow(datarow);
        }

        //enable/disabe row
        function enableRow(row) {
            $.each(config.columns, function (index, column) {
                var field = row.find('td:nth-child(' + (index + 1) + ')').children().first();

                if (column.type === 'text') {

                    field.removeClass('disabled');
                    field.prop('readonly', false);
                }

                if (config.onFieldEnable) {
                    config.onFieldEnable(field, column.field);
                }

            });
        }

        function disableRow(row) {
            $.each(config.columns, function (index, column) {
                var field = row.find('td:nth-child(' + (index + 1) + ')').children().first();

                if (column.type === 'text') {

                    field.addClass('disabled');
                    field.prop('readonly', true);
                }

                if (config.onFieldDisable) {
                    config.onFieldDisable(field, column.field);
                }
            });
        }

        //init
        $.extend(config, defaultSettings, settings);
        
        checkConfig();

        if (config.canUpdate) {
            ACTIONS.push(UPDATE_ACTION);
        }

        if (config.canDelete) {
            ACTIONS.push(DELETE_ACTION);
        }

        if (config.canCopy) {
            ACTIONS.push(COPY_ACTION);
        }

        // store jquery table element
        $table = $(this);
        $table.addClass(config.css.table);

        //build table
        buildHeader();
        buildBody();
        buildFooter();
        buildPagination();
    };
})(jQuery);