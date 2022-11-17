var swidth = 960,
    sheight = 600,
    margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = swidth - margin.left - margin.right,
    height = sheight - margin.top - margin.bottom;

var schemaRange = 9;

var color = "schemeOrRd";
var countyLine = 0;

function colorScheme() {
  if (color === "schemeOrRd")
    return  colorOrRd;
  else if (color === "schemeYlGn")
    return  colorYlGn;
}

var colorOrRd = d3.scaleThreshold()
    .domain([1, 2, 3, 5, 8, 13, 30, 50, 85])
    .range(d3.schemeOrRd[schemaRange]);

var colorYlGn = d3.scaleThreshold()
    .domain([1, 2, 3, 5, 8, 13, 30, 50, 85])
    .range(d3.schemeYlGn[schemaRange]);

var tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip');

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

var x = d3.scaleSqrt()
    .domain([0, 120])
    .rangeRound([00, 600]);

var path = d3.geoPath();

var densityById = d3.map();

load();

function load(){
  d3.queue()
  .defer(d3.json, "us-10m.v2.json")
  .defer(d3.csv, "USPopDensity.csv", function(d) { densityById.set(d.id, +d.density); })
  .await(ready);
}

drawLegend();

function ready(error, us) {
  if (error) throw error;

  drawMap(us);
}

function drawMap(us) {
    
  var statesFeature = topojson.feature(us, us.objects.states)
    .features
    .filter(function(d) {  return d.id == 38; })[0]; // get a geojson object (not an array of objects)
  
var countiesFeature = topojson.feature(us, us.objects.counties)
    .features
    .filter(function(d) {
    return d.id.substring(0,2) === "38"; })[0]; // get a geojson object (not an array of objects)

  var stateProjection = d3.geoIdentity()
    .fitSize([width,height],statesFeature); // scale and translate the map so the feature is centered

  path.projection(stateProjection);

  svg.append("g")
  .attr("class", "states")
  .append("path")
  .datum(statesFeature)
  .attr("d", path)
  .attr('id', 'land'); // draw the path.

  svg.append("clipPath")
  .attr("id", "clip-land")
  .append("use")
  .attr("xlink:href", "#land");

  svg.attr("class", "counties")
  .append("g")
  .selectAll("path")
  .data(topojson.feature(us, us.objects.counties).features)
  .enter().append("path")
  .attr("class", "schema")
  .attr("fill", function(d) { return colorScheme()(densityById.get(d.id)); })
  .attr("d", path)
  .attr("clip-path", "url(#clip-land)")
  .attr('class', 'county')
  .on('mouseover', function (d) {
    this.classList.add('hovered')
    tooltip.text(d.properties.name+" : "+densityById.get(d.id)+" people per square mile.").style('display', '')
  })
  .on('mousemove', function () {
    tooltip
      .style('top', (d3.event.pageY - 10) + 'px')
      .style('left', (d3.event.pageX + 10) + 'px')
  })
  .on('mouseout', function () {
    this.classList.remove('hovered')
    tooltip.style('display', 'none')
  })
  ;
};

function drawLegend() {
  var g = d3.select("#legend").append("svg")
    .attr("width", 900)
    .attr("height", 75)
    .append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

g.selectAll("rect")
  .data(colorScheme().range().map(function(d) {
      d = colorScheme().invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return colorScheme()(d[0]); });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population per square mile");

g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickValues(colorScheme().domain()))
  .select(".domain")
    .remove();
}

function changeColorScheme() {
  if (color === "schemeOrRd") {
    color = "schemeYlGn";
    document.querySelector('#schema').innerText= "Change to Orange-Red Schema";
    d3.selectAll("rect").attr("fill", function(d) { return colorScheme()(d[0]); });
  } else if (color === "schemeYlGn") {
    color = "schemeOrRd";
    document.querySelector('#schema').innerText= "Change to Yellow-Green Schema";
    d3.selectAll("rect").attr("fill", function(d) { return colorScheme()(d[0]); });
  }
  load();
}

function changeCountyBorder() {
  if (countyLine === 0) {
    countyLine = 1;
    document.querySelector('#countyLines').innerText= "Hide County Lines";
    svg.selectAll("path").attr("stroke-width", "1px");
  } else if (countyLine === 1) {
    countyLine = 0;
    d3.select("countyLines").text("Show County Lines");
    document.querySelector('#countyLines').innerText= "Show County Lines";
    svg.selectAll("path").attr("stroke-width", ".1px");
  }
}