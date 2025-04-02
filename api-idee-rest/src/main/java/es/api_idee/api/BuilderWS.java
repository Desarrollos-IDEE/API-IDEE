package es.api_idee.api;

import java.util.List;

import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.UriInfo;

import es.api_idee.builder.JSBuilder;
import es.api_idee.parameter.Parameters;
import es.api_idee.parameter.parser.ParametersParser;
import es.api_idee.plugins.PluginsManager;

@Produces("application/javascript; charset=UTF-8") 
@Path("/")
public class BuilderWS {

   @Context
   private ServletContext context;
   
   /**
    * Provides the code to build a map using the Javascript
    * API
    * 
    * @param callbackFn the name of the javascript
    * function to execute as callback
    * 
    * @return the javascript code
    */
   @GET
   @Path("/js")
   public String js(@Context UriInfo uriInfo) {
      MultivaluedMap<String, String> queryParams = uriInfo.getQueryParameters();

      Parameters parameters = ParametersParser.parse(queryParams);
      
      // plugins
      PluginsManager.init(context);
      List<String> plugins = PluginsManager.getPlugins(queryParams);
      
      String codeJS = JSBuilder.build(parameters, plugins);

      return codeJS;
   }
}
