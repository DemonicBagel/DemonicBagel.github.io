const tooltip = d3.select('.tooltip');
var color = 1;
var colorchoice;
var counties;
var population;
var border = 1;

var margin = {left: 80, right: 160, top: 50, bottom: 50 }, 
    width = 1280 - margin.left -margin.right,
    height = 500 - margin.top - margin.bottom;

//Define Color
var colors = d3.scaleOrdinal(d3.schemePaired)

//Define SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


Promise.all([d3.json("us.geojson"), d3.csv("pop.csv")]).then(function (values) {
    counties = values[0];
    population = values[1];

    counties.features = counties.features.filter(function (d) {
        return d.properties.STATE == 55;
        });

    population = population.filter(function (d) {
        return d["GEO.display-label"] == "Wisconsin";
    });
    updateMap();
});
    

//The following was heavily inspired by the advice of Rahul Vaidun
function updateMap() {

        svg.selectAll("*").remove();
        let projection = d3
        .geoMercator()
        .scale(400)
        .center(d3.geoCentroid(counties))
        .translate([
        +svg.style("width").replace("px", "") / 2,
        +svg.style("height").replace("px", "") / 2.3,
        ])
        .scale(5000)
        .translate([width / 2, height / 2])
        .precision(0.1)
        .fitSize([width, height], counties)

        let path = d3.geoPath().projection(projection);
        let extent = d3.extent(population, (d) => +d["Density per square mile of land area"]);

        if (color == 0) {
            colorchoice = d3.scaleSequential(d3.interpolateBlues).domain(extent);
        } else {
            colorchoice = d3.scaleSequential(d3.interpolateOrRd).domain(extent);
        }

        let g = svg.append("g");
        g.selectAll("path")
            .data(counties.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("id", (d) => d.properties.name)
            .attr("class", "countymap")
            .style("fill", (d) => {
                let temp = population.filter((p) => {
                return p["GCT_STUB.target-geo-id"] == d.properties.GEO_ID;
                })[0]["Density per square mile of land area"];
                return colorchoice(temp);
            })
            .style("stroke", border ? "black" : "none")
            .on("mouseover", function (d, i) {
                let temp = population.filter((p) => {
                return p["GCT_STUB.target-geo-id"] == d.properties.GEO_ID;
                })[0]["Density per square mile of land area"];
                tooltip.transition().duration(100).style("opacity", 1);
                mapttstring = `County: ${d.properties.NAME} <br/>
                        Population Density per square mile of land area: ${temp} <br/>`;
                tooltip.html(mapttstring);
            })
            .on("mousemove", function (d) {
                tooltip.style("left", (d3.event.pageX + 20) + "px")
                    .style("top", (d3.event.pageY - 30) + "px");
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .style("stroke", border ? "black" : "none")
                    .style("stroke-width", 1);
                tooltip.style("opacity", 0);
                d3.select(this).attr("fill", "black");
            });

            axisScale = d3.scaleLinear().domain(extent).range([0, 200]);
            axisBottom = (g) =>
                g
                    .attr("class", `x-axis`)
                    .attr("transform", `translate(0,400)`)
                    .call(d3.axisBottom(axisScale).ticks(4).tickSize(20));

            svg.append("g").call(axisBottom);

            //The following code is heavily inspired by Ernest Jinian's advice and guidance
            const defs = svg.append("defs");

            const linearGradient = defs
            .append("linearGradient")
            .attr("id", "linear-gradient");
        
            linearGradient
                .selectAll("stop")
                .data(
                    colorchoice.ticks().map((t, i, n) => ({
                    offset: `${(100 * i) / n.length}%`,
                    color: colorchoice(t),
                    }))
                )
                .enter()
                .append("stop")
                .attr("offset", (d) => d.offset)
                .attr("stop-color", (d) => d.color)
                .attr("stop-opacity", 1);
        
            
            svg
                .append("g")
                .attr("transform", `translate(0, 400)`)
                .append("rect")
                .attr("width", 200)
                .attr("height", 20)
                .style("fill", "url(#linear-gradient)")

            svg.append("g").call(axisBottom);
        
            svg
                .append("text")
                .attr("class", "legend")
                .attr("transform", `translate(0, 400)`)
                .text("Population Density per square mile of land area")
                .attr("fill", "white")

            if (border) {
                d3.select(svg.g).style("stroke", "lightblue").style("stroke-width", 5);
            }
}

function colorchange() {
    if (color == 0) {
        color = 1;
      } else {
        color = 0;
    }
    updateMap();
}

function borderlines() {
    border = !border;
    updateMap();
} 
