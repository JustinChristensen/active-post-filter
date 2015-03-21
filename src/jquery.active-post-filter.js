;(function (window, document, undefined) {
    "use strict";

    function definePlugin($, Isotope, Mustache) {

        // @private
        var _PLUGIN_NAME = "activePostFilter",

            _NAMESPACE = "active-post-filter",

            _FILTER_ACTION = "do_post_filter",

            _ENTER_KEY = 13,

            _LINK_TEMPLATE = '' +
                '<li>' +
                    '<a href="#" title="Page {{{page}}}" data-page="{{{page}}}">{{{page}}}</a>' +
                '</li>',

            _PAGE_ACTIVE_STATE = "page-active",
            _PAGINATION_HIDDEN_STATE = "pagination-hidden",

            _defaults = {
                filters: {},
                pagination: {},
                isotope: {}
            },

            _slice = Array.prototype.slice,

            _hasInputEvent = function () {
                return !window.Modernizr || Modernizr.hasEvent("input");
            },

            _setTimeout = function (context, func, delay) {
                var args = _slice.call(arguments, 3);

                return setTimeout(function () {
                    func.apply(context || null, args);
                }, delay);
            },

            _bindFilterEvents = function (filterConfigs) {
                var _self = this;

                $.each(filterConfigs, function (prop, filterConfig) {
                    var data;

                    if (filterConfig.$filter && filterConfig.event !== "") {
                        data = {
                            delay: filterConfig.delay
                        };

                        filterConfig.$filter.off("." + _NAMESPACE);

                        if (filterConfig.event === "input" && !_hasInputEvent()) {
                            filterConfig.$filter.on("change." + _NAMESPACE, data, $.proxy(_filterHandler, _self));
                        }
                        else if (filterConfig.event !== "") {
                            filterConfig.$filter.on(filterConfig.event + "." + _NAMESPACE, data, $.proxy(_filterHandler, _self));
                        }
                    }
                });
            },

            _getFilterValue = function (filterConfig, value) {
                var filterValue = {},
                    whitelist = ["type", "operator", "field"],
                    propCount = 0,
                    prop, i, len;

                for (i = 0, len = whitelist.length; i < len; i++) {
                    prop = whitelist[i];

                    if (filterConfig[prop] !== undefined) {
                        filterValue[prop] = filterConfig[prop];
                        propCount++;
                    }
                }

                if (propCount > 0) {
                    filterValue.value = value;
                }
                else {
                    filterValue = value;
                }

                return filterValue;
            },

            _filterHandler = function (e) {
                var $this = $(e.target);

                e.preventDefault();

                if (e.data.delay) {
                    clearTimeout(e.data.timer);
                    e.data.timer = _setTimeout(this, this.filter, e.data.delay, $this.attr("name"), $this.val());
                }
                else {
                    this.filter($this.attr("name"), $this.val());
                }
            },

            _stateChangeHandler = function (e) {
                this.getPosts(this.state.get()).then(_renderUI);
            },

            _pageChangeHandler = function (e) {
                var $this = $(e.target),
                    state = this.state.get(),
                    $pages = this.pagination._pages,
                    page, nextpage;

                e.preventDefault();

                if (typeof (page = $this.data("page")) === "number") {
                    nextpage = page;
                }
                else {
                    switch (page) {
                        case "previous":
                            nextpage = state.page > 1 ? state.page - 1 : state.page;
                            break;
                        case "next":
                            nextpage = state.page < $pages.length ? state.page + 1 : state.page;
                            break;
                        case "last":
                            nextpage = $pages.length;
                            break;
                        default:
                            nextpage = 1;
                            break;
                    }
                }

                if (state.page !== nextpage) {
                    $pages.removeClass(_PAGE_ACTIVE_STATE);
                    $($pages[nextpage - 1]).addClass(_PAGE_ACTIVE_STATE);

                    this.state.set({
                        page: nextpage
                    });
                }
            },

            _renderUI = function (data) {
                var items = _buildItems(data.posts, this.config.itemTemplate),
                    links;

                this.renderItems(items);

                if (data.pages !== this.pagination._pages.length) {
                    links = _buildPageLinks(data.pages, _LINK_TEMPLATE);
                    this.renderPagination(links);
                }
            },

            _buildItems = function (posts, template) {
                var items = $(),
                    rendered;

                if (Mustache) {
                    Mustache.parse(template);

                    $.each(posts, function () {
                        rendered = $.trim(Mustache.render(template, this).replace(/\s+/, " "));
                        items.push($(rendered)[0]);
                    });
                }
                else if (window.console && console.warn) {
                    console.warn("$.fn." + _PLUGIN_NAME + ": Mustache is missing.");
                }

                return items;
            },

            _buildPageLinks = function (pages, template) {
                var links = $(),
                    i, len,
                    rendered;

                if (Mustache) {
                    Mustache.parse(template);

                    for (i = 1, len = pages; i <= len; i++) {
                        rendered = $.trim(Mustache.render(template, { page: i }).replace(/\s+/, " "));
                        links.push($(rendered)[0]);
                    }
                }
                else if (window.console && console.warn) {
                    console.warn("$.fn." + _PLUGIN_NAME + ": Mustache is missing.");
                }

                return links;
            },

            _setFilters = function (filterConfigs, state) {
                var filters = {};

                $.each(filterConfigs, function (prop, filterConfig) {
                    var $filter;

                    if (!filterConfig.$filter) {
                        $filter = $(filterConfig.filter);

                        if ($filter.length > 0) {
                            filters[$filter.attr("name")] = $.extend({}, filterConfig, {
                                "$filter": $filter
                            });

                            if ($filter.attr("type") === "checkbox" || $filter.attr("type") == "radio") {
                                state[$filter.attr("name")] = $filter.filter(":checked").val() || "";
                            }
                            else {
                                state[$filter.attr("name")] = $filter.val();
                            }
                        }
                    }
                });
                return filters;
            },

            _setPagination = function (paginationConfig, state) {
                var pagination = {};

                $.each(paginationConfig, function (prop, pager) {
                    pagination["$" + prop] = $(pager);
                });

                if (pagination.$pages) {
                    pagination._pages = pagination.$pages.find("li");
                }

                state.page = 1;

                return pagination;
            },

            _stateFactory = function () {
                return (function () {
                    var _state = {},
                        _$mediator = $({}),

                        _setState = function (state, silent) {
                            $.extend(_state, state);

                            if (!silent) {
                                _$mediator.trigger("change");
                            }
                        },

                        _getState = function () {
                            return $.extend({}, _state);
                        },

                        _on = function () {
                            $.fn.on.apply(_$mediator, _slice.call(arguments));
                        };

                    return {
                        set: _setState,
                        get: _getState,
                        on: _on
                    };
                }());
            };

        // @constructor
        function ActivePostFilter(element, config) {
            this.$element = $(element);
            this.initialize(config);
        }

        // @public
        ActivePostFilter.prototype = {

            initialize: function (config) {
                var _self = this,
                    initialState = {};

                this.setConfig(config);
                this.state = _stateFactory();

                this.form = $(this.config.form);
                this.filters = _setFilters(this.config.filters, initialState);
                this.pagination = _setPagination(this.config.pagination, initialState);
                this.state.set(initialState, true);

                // bridget isotope to the jquery prototype
                if (typeof define === "function" && define.amd) {
                    require(["jquery-bridget/jquery.bridget"], function () {
                        $.bridget("isotope", Isotope);
                        _self.render();
                        _self.bind();
                    });
                }
                else {
                    _self.render();
                    _self.bind();
                }
            },

            render: function () {
                if ($.fn.isotope) {
                    this.$element.isotope(this.config.isotope);
                }
                else if (window.console && console.warn) {
                    console.warn("$.fn." + _PLUGIN_NAME + ": Isotope is missing.");
                }
            },

            bind: function () {
                this.state.on("change", $.proxy(_stateChangeHandler, this));
                _bindFilterEvents.call(this, this.filters);

                if (this.pagination.$container) {
                    this.pagination.$container.off("click." + _NAMESPACE);
                    this.pagination.$container.on("click." + _NAMESPACE, "a", $.proxy(_pageChangeHandler, this));
                }

                if (this.form.length) {
                    this.form.on("keypress", function (e) {
                        if (e.which === _ENTER_KEY) {
                            e.preventDefault();
                        }
                    });
                }
            },


            filter: function (name, value) {
                var newState = {
                    page: 1
                };

                newState[name] = value;

                this.state.set(newState);
            },

            getPosts: function (state) {
                var deferred = new $.Deferred(),
                    _self = this,
                    data = {
                        action: _FILTER_ACTION,
                        post_type: this.config.postType,
                        paged: state.page
                    };

                $.each(state, function (prop, value) {
                    if (value && value !== "") {
                        if (_self.filters[prop]) {
                            data[prop] = _getFilterValue(_self.filters[prop], value);
                        }
                    }
                });

                $.ajax({
                    url: wpglobals.ajaxURL,
                    dataType: "json",
                    data: data
                }).then(function (data, status, xhr) {
                    deferred.resolveWith(_self, [ data ]);
                }, function (xhr, status, error) {
                    deferred.rejectWith(_self, [ error ]);
                });

                return deferred.promise();
            },

            renderItems: function (items) {
                this.$element.isotope("remove", this.$element.isotope("getItemElements"));
                this.$element.isotope("insert", items);
            },

            renderPagination: function (pages) {
                var toggleMethod = pages.length <= 1 ? "addClass" : "removeClass";

                this.pagination._pages.remove();

                this.pagination.$container[toggleMethod]("pagination-hidden");
                this.pagination.$pages.html(pages);

                this.pagination._pages = pages;
                this.pagination._pages.first().addClass(_PAGE_ACTIVE_STATE);
            },

            destroy: function () {
            },

            setConfig: function (config) {
                this.config = $.extend(true, {}, _defaults, config);
            }

        };

        // expose plugin
        $.fn[_PLUGIN_NAME] = function (config) {
            var args = arguments;

            this.each(function () {
                var plugin;

                if (!$.data(this, "plugin_" + _PLUGIN_NAME)) {
                    $.data(this, "plugin_" + _PLUGIN_NAME, new ActivePostFilter(this, config));
                }
                else if ($.type(config) === "string") {
                    plugin = $.data(this, "plugin_" + _PLUGIN_NAME);

                    if ($.type(plugin[config]) === "function") {
                        plugin[config].apply(plugin, $.makeArray(args).slice(1));
                    }
                    else {
                        if (window.console && window.console.warn) {
                            console.warn("$.fn." + _PLUGIN_NAME + ": Plugin instance has no method named " + config);
                        }
                    }
                }
            });

            return this;
        };

    }

    if (typeof define === "function" && define.amd) {
        define(["jquery", "isotope", "mustache"], definePlugin);
    }
    else {
        definePlugin(window.jQuery, window.Isotope);
    }

}(window, document));
