var ResourcesLib = ResourcesLib || {};
var ResourcesLib = {

  resources_list: [],

  init: function(geography_geometry, geography_centroid, url_fragment) {
    var geojsonFeature = {
        "type": "Feature",
        "geometry": geography_geometry
    };

    LeafletLib.initialize("map_resources", { geojson: geojsonFeature }, geography_centroid, 13);

    var bounds = [LeafletLib.latmax, LeafletLib.lngmax, LeafletLib.latmin, LeafletLib.lngmin];
    bounds[0] = (bounds[0] + "").replace(".",",");
    bounds[1] = (bounds[1] + "").replace(".",",");
    bounds[2] = (bounds[2] + "").replace(".",",");
    bounds[3] = (bounds[3] + "").replace(".",",");

    $.getJSON("/resources" + url_fragment + "/" + bounds.join("/") + ".json", function(resources){
      
      ResourcesLib.resources_list = resources;

      // populate list of categories
      for (var i=0;i<ResourcesLib.resources_list.length;i++) {
        $("#categories").append("\
          <li><a href='#' data-category='" + ResourcesLib.resources_list[i]['category'] + "'>\
          " + ResourcesLib.humanize(ResourcesLib.resources_list[i]['category']) + "\
          <span class='badge pull-right'>" + ResourcesLib.resources_list[i]['resources'].length + "</span>\
          </a>\
          </li>");
      }

      // bind clickable event for categories
      $("#categories a").click(function(){
        ResourcesLib.render_category($(this).attr('data-category'));
        return false;
      });

      if ($.address.parameter('category') != null)
        ResourcesLib.render_category($.address.parameter('category'));
      else
        ResourcesLib.render_category('all'); // by default, show all

      // toggle map / list view
      ResourcesLib.toggle_view($.address.parameter('view_mode'));
      
    });
  },

  render_category: function(category){
    // clean up and highlight selected
    ResourcesLib.reset_view();
    $("#categories li").attr("class", "");
    $("[data-category='" + category + "']").parent().attr("class", "active");
    $.address.parameter('category', category);

    var resources = [];
    for (var i=0;i<ResourcesLib.resources_list.length;i++)
      if (ResourcesLib.resources_list[i]['category'] == category)
        resources = ResourcesLib.resources_list[i]['resources'];

    for (var i=0;i<resources.length;i++) {
      // clean up source data
      if (resources[i]['phone'].indexOf("N/A") >= 0 ) resources[i]['phone'] = '';

      // populate table and map
      var table_template = "\
        <tr>\
          <td><strong>{{organization_name}}</strong><br />{{program_name}}</td>\
          <td>{{address}}</td>\
          <td>{{phone}}</td>\
        </tr>\
        ";
      $("#intervention_list").append(Mustache.render(table_template, resources[i]));

      var map_template = "\
        <b>{{organization_name}}</b>\
        <br />{{program_name}}<br/>\
        {{address}}<br/>\
        {{phone}}\
        ";

      LeafletLib.addMarker(
        (new L.Marker(
          new L.LatLng( resources[i]['latitude'], resources[i]['longitude'] )
        )).bindPopup(Mustache.render(map_template, resources[i]))
      );
    }
  },

  toggle_view: function(view_mode){
    console.log(view_mode);
    if (view_mode == 'list') {
      $("#toggle_view").html("Map <i class='icon-map-marker'></i>");
      $.address.parameter('view_mode', 'list');
      $("#map_resources").hide();
      $("#table_resources").show();
    }
    else {
      $("#toggle_view").html("List <i class='icon-list'></i>");
      $.address.parameter('view_mode', 'map');
      $("#map_resources").show();
      $("#table_resources").hide();
    }

  },

  reset_view: function() {
    LeafletLib.clearMarkers(); 
    $("#intervention_list").html("");
  },

  humanize: function(property) {
    return property.replace(/_/g, ' ').replace(/(\w+)/g, function(match) {
      return match.charAt(0).toUpperCase() + match.slice(1);
    });
  }
}