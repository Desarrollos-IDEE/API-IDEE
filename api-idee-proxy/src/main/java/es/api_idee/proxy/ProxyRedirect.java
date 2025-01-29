/**
* Empresa desarrolladora: GUADALTEL S.A.
*
* Autor: IGN
*
* Derechos de explotación propiedad de la Junta de Andalucía.
*
* Este programa es software libre: usted tiene derecho a redistribuirlo y/o modificarlo bajo los
* términos de la
*
* Licencia EUPL European Public License publicada por el organismo IDABC de la Comisión Europea, en
* su versión 1.0. o posteriores.
*
* Este programa se distribuye de buena fe, pero SIN NINGUNA GARANTÍA, incluso sin las presuntas
* garantías implícitas de USABILIDAD o ADECUACIÓN A PROPÓSITO CONCRETO. Para mas información
* consulte la Licencia EUPL European Public License.
*
* Usted recibe una copia de la Licencia EUPL European Public License junto con este programa, si
* por algún motivo no le es posible visualizarla, puede consultarla en la siguiente URL:
* http://ec.europa.eu/idabc/servlets/Doc?id=31099
*
* You should have received a copy of the EUPL European Public License along with this program. If
* not, see http://ec.europa.eu/idabc/servlets/Doc?id=31096
*
* Vous devez avoir reçu une copie de la EUPL European Public License avec ce programme. Si non,
* voir http://ec.europa.eu/idabc/servlets/Doc?id=30194
*
* Sie sollten eine Kopie der EUPL European Public License zusammen mit diesem Programm. Wenn nicht,
* finden Sie da http://ec.europa.eu/idabc/servlets/Doc?id=29919
*/
/******************************************************************
* Filename: ProxyRedirect.java Document Type: Java servlet Purpose: This servlet will write the
* body content of a request to a file. The file name is returned as the response. Set the output
* directory as servlet init-param in web.xml
*
* License: LGPL as per: http://www.gnu.org/copyleft/lesser.html $Id: ProxyRedirect.java 3650
* 2007-11-28 00:26:06Z rdewit $
*
* MAMP* Realizadas las modificaciones indicadas por el parche de la página para que funcione con el
* encoding UTF-8
* http://jira.codehaus.org/browse/MAP-547?page=com.atlassian.jira.plugin.system.issuetabpanels
* :all-tabpanel http://jira.codehaus.org/secure/attachment/35062/ProxyRedirect.patch Realizadas las
* modificaciones indicadas en la página para que funcione con redirecciones
* http://www.discursive.com/books/cjcook/reference/http-webdav-sect-handle-redirect.html
**************************************************************************/
package es.api_idee.proxy;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.Map;
import java.util.regex.Pattern;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.codec.binary.Base64;

import org.apache.commons.io.IOUtils;
import org.apache.http.Header;
// import org.apache.http.HttpEntity;
import org.apache.http.HttpStatus;
// import org.apache.http.auth.Credentials;
// import org.apache.http.auth.UsernamePasswordCredentials;
// import org.apache.http.client.CredentialsProvider;
// import org.apache.http.client.ResponseHandler;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet; 
import org.apache.http.client.methods.HttpPost; 
// import org.apache.http.entity.ByteArrayEntity;
import org.apache.http.entity.StringEntity;
// import org.apache.http.impl.client.BasicCredentialsProvider;
// import org.apache.http.impl.client.BasicResponseHandler;
// import org.apache.http.impl.client.DefaultHttpRequestRetryHandler;
// import org.apache.http.protocol.HTTP;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.log4j.Logger;

import es.guadaltel.framework.ticket.Ticket;
import es.guadaltel.framework.ticket.TicketFactory;

// PATCH import org.apache.log4j.PropertyConfigurator;
@SuppressWarnings("serial")
// PATCH
public class ProxyRedirect extends HttpServlet {

  private final static Logger log = Logger.getLogger(ProxyRedirect.class);
  private static final Pattern GETINFO_PLAIN_REGEX = Pattern.compile(".*INFO_FORMAT=TEXT(\\/|\\%2F)PLAIN.*",
  Pattern.CASE_INSENSITIVE);
  private static final Pattern GETINFO_GML_REGEX = Pattern
  .compile(".*INFO_FORMAT=APPLICATION(\\/|%2F)VND\\.OGC\\.GML.*", Pattern.CASE_INSENSITIVE);
  private static final Pattern GETINFO_HTML_REGEX = Pattern.compile(".*INFO_FORMAT=TEXT(\\/|\\%2F)HTML.*",
  Pattern.CASE_INSENSITIVE);
  private static final String WWW_AUTHENTICATE = "WWW-Authenticate"; // PATH
  private static final String AUTHORIZATION = "Authorization"; // PATH
  public ServletContext context_ = null;
  private String errorType = "";
  private Integer numMaxRedirects = 5;
  private boolean soap = false;

  /***************************************************************************
  * Initialize variables called when context is initialized
  ****************************************************************************/
  public void init(ServletConfig config) throws ServletException {
    super.init(config);
    context_ = config.getServletContext();
    // log.info("proxysig.ProxyRedirect: context initialized to: " + context_.getServletContextName());
  }

  /***************************************************************************
  * Process the HTTP Get request
  ***************************************************************************/
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException {
    String serverUrl = request.getParameter("url");
    // manages a get request if it's the geoprint or getcapabilities operation
    boolean isGeoprint = serverUrl.toLowerCase().contains("apiIdeeop=geoprint");
    boolean isGetCapabilities = serverUrl.toLowerCase().contains("getcapabilities");
    boolean isGetFeatureInfo = serverUrl.toLowerCase().contains("wmsinfo");
    if (isGeoprint || isGetCapabilities || isGetFeatureInfo) {
      String strErrorMessage = "";
      serverUrl = checkTypeRequest(serverUrl);
      if (!serverUrl.equals("ERROR")) {
        // removes apiIdeeop parameter
        String url = serverUrl.replaceAll("\\&?\\??apiIdeeop=geoprint", "");
        url = url.replaceAll("\\&?\\??apiIdeeop=getcapabilities", "");
        url = url.replaceAll("\\&?\\??apiIdeeop=wmsinfo", "");

        CloseableHttpClient client = HttpClientBuilder.create().build();
        HttpGet httpget = null;
        CloseableHttpResponse httpResponse = null;

        try {
          httpget = new HttpGet(url);
          httpget.setConfig(RequestConfig.custom().setMaxRedirects(numMaxRedirects).build());

          httpResponse = client.execute(httpget);

          if (httpResponse.getStatusLine().getStatusCode() == HttpStatus.SC_OK) {
            // PATH_SECURITY_PROXY - AG
            Header[] respHeaders = httpResponse.getAllHeaders();
            // we read body to get length
            byte[] bodyBytes = null;
            try {
              bodyBytes = IOUtils.toByteArray(httpResponse.getEntity().getContent());
            } catch (Exception ex) {
              log.error("Error reading response body: " + ex.getMessage(), ex);
            }
            int compSize = (bodyBytes != null) ? bodyBytes.length : 0;
            ArrayList<Header> headerList = new ArrayList<Header>(Arrays.asList(respHeaders));
            String headersString = headerList.toString();
            boolean checkedContent = checkContent(headersString, compSize, serverUrl);
            // FIN_PATH_SECURITY_PROXY
            if (checkedContent) {
              if (request.getProtocol().compareTo("HTTP/1.0") == 0) {
                response.setHeader("Pragma", "no-cache");
              } else if (request.getProtocol().compareTo("HTTP/1.1") == 0) {
                response.setHeader("Cache-Control", "no-cache");
              }
              response.setDateHeader("Expires", -1);
              // set content-type headers
              if (isGeoprint) {
                response.setContentType("application/json");
              } else if (isGetCapabilities) {
                response.setContentType("text/xml");
              }
              /*
              * checks if it has requested an getfeatureinfo to modify the response content
              * type.
              */
              String requesteredUrl = request.getParameter("url");
              if (GETINFO_PLAIN_REGEX.matcher(requesteredUrl).matches()) {
                response.setContentType("text/plain");
              } else if (GETINFO_GML_REGEX.matcher(requesteredUrl).matches()) {
                response.setContentType("application/gml+xml");
              } else if (GETINFO_HTML_REGEX.matcher(requesteredUrl).matches()) {
                response.setContentType("text/html");
              }
              if (bodyBytes != null) {
                ServletOutputStream sos = response.getOutputStream();
                IOUtils.write(bodyBytes, sos);
              }
            } else {
              strErrorMessage += errorType;
              log.error(strErrorMessage);
            }
          } else {
            strErrorMessage = "Unexpected failure: " + httpResponse.getStatusLine().toString();
            log.error(strErrorMessage);
          }
        } catch (Exception e) {
          log.error("Error al tratar el contenido de la peticion: " + e.getMessage(), e);
        } finally {
          // release connections
          if (httpResponse != null) {
            try { httpResponse.close(); } catch (IOException ign) {}
          }
          if (client != null) {
            try { client.close(); } catch (IOException ign) {}
          }
        }
      } else {
        // String errorXML = strErrorMessage;
        String errorXML = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><error><descripcion>Error en el parametro url de entrada</descripcion></error>";
        response.setContentType("text/xml");
        try {
          PrintWriter out = response.getWriter();
          out.print(errorXML);
          response.flushBuffer();
        } catch (Exception e) {
          log.error(e);
        }
      }
    } else {
      doPost(request, response);
    }
  }

  /***************************************************************************
  * Process the HTTP Post request
  ***************************************************************************/
public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException {
    boolean checkedContent = false;
    boolean legend = false;
    String strErrorMessage = "";
    String serverUrl = request.getParameter("url");
    log.info("POST param serverUrl: " + serverUrl);
    if (serverUrl.startsWith("legend")) {
      serverUrl = serverUrl.replace("legend", "");
      serverUrl = serverUrl.replace("?", "&");
      serverUrl = serverUrl.replaceFirst("&", "?");
      legend = true;
    }

    serverUrl = checkTypeRequest(serverUrl);
    if (!serverUrl.equals("ERROR")) {
      if (serverUrl.startsWith("http://") || serverUrl.startsWith("https://")) {
        if (!serverUrl.contains("/processes/")) {
          CloseableHttpResponse postResp = null;
          CloseableHttpClient client = null;
          try {
            client = HttpClientBuilder.create().build();
            HttpPost httppost = new HttpPost(serverUrl);

            // PATH
            Enumeration<?> enume = request.getHeaderNames();
            ArrayList<String> removeHeaders = new ArrayList<>(Arrays.asList("accept-encoding"));
            while (enume.hasMoreElements()) {
              String name = (String) enume.nextElement();
              String value = request.getHeader(name);
              log.debug("request header:" + name + ":" + value);
              if (!removeHeaders.contains(name.toLowerCase())) {
                httppost.addHeader(name, value);
              }
            }

            // We won't replicate "httppost.setDoAuthentication(false)" or "DefaultHttpMethodRetryHandler"
            // because they don't exist in 4.x. Usually you'd use RequestConfig or HttpClientBuilder here.

            // PATH_apiideeDITA_SECURITY - AP
            // PATCH_TICKET_MJM-20112405-POST
            String authorizationValue = request.getHeader(AUTHORIZATION); // ADD_SECURITY_20091210
            if (authorizationValue == null) {
              String user = (String) request.getSession().getAttribute("user");
              String pass = (String) request.getSession().getAttribute("pass");
              if (user != null && pass != null) {
                String userAndPass = user + ":" + pass;
                String encodedLogin = new String(Base64.encodeBase64(userAndPass.getBytes()));
                httppost.addHeader(AUTHORIZATION, "Basic " + encodedLogin);
              } else {
                String ticketParameter = request.getParameter("ticket");
                if (ticketParameter != null) {
                  ticketParameter = ticketParameter.trim();
                  if (!ticketParameter.isEmpty()) {
                    Ticket ticket = TicketFactory.createInstance();
                    try {
                      Map<String, String> props = ticket.getProperties(ticketParameter);
                      user = props.get("user");
                      pass = props.get("pass");
                      String userAndPass = user + ":" + pass;
                      String encodedLogin = new String(Base64.encodeBase64(userAndPass.getBytes()));
                      httppost.addHeader(AUTHORIZATION, "Basic " + encodedLogin);
                    } catch (Exception e) {
                      log.info("-------------------------------------------");
                      log.info("EXCEPCTION THROWED BY PROXYREDIRECT CLASS");
                      log.info("METHOD: doPost");
                      log.info("TICKET VALUE: " + ticketParameter);
                      log.info("-------------------------------------------");
                    }
                  }
                }
              }
            } else {
              httppost.addHeader(AUTHORIZATION, authorizationValue);
            }
            // FIN_PATH_TICKET_MJM-20112405-POST
            // FIN_PATH_apiideeDITA_SECURITY - AP

            // Build POST entity
            String body = null;
            try {
              body = inputStreamAsString(request.getInputStream());
            } catch (IOException ioe) {
              log.error("Error reading request body: " + ioe.getMessage(), ioe);
            }
            if (body != null) {
              // CHANGED: use "UTF-8" as String (no Charset -> compile error)
              StringEntity bodyEntity = new StringEntity(body, StandardCharsets.UTF_8);
              // We do not set explicit content type here => it was null in old code
              httppost.setEntity(bodyEntity);
            }

            // if (soap) ...
            if (soap) {
              httppost.addHeader("SOAPAction", serverUrl);
            }

            postResp = client.execute(httppost); // CAMBIO: HttpResponse -> CloseableHttpResponse

            // PATH_FOLLOW_REDIRECT_POST - minimal equivalent
            int j = 0;
            Header locationHeader = postResp.getFirstHeader("location");
            // We do a simple loop for 3xx responses
            while (locationHeader != null && j < numMaxRedirects
                   && (postResp.getStatusLine().getStatusCode() >= 300
                       && postResp.getStatusLine().getStatusCode() < 400)) {
              String redirectLocation = locationHeader.getValue();
              log.debug("Redirecting to: " + redirectLocation);
              postResp.close();

              HttpPost newPost = new HttpPost(redirectLocation);
              if (redirectLocation.toLowerCase().contains("wsdl")) {
                // from old code
                String newLocNoWSDL = serverUrl.replace("?wsdl", "");
                newPost.addHeader("SOAPAction", newLocNoWSDL);
                newPost.addHeader("Content-type", "text/xml");
              }
              // set same body again
              if (body != null) {
                StringEntity bodyEntityPost = new StringEntity(body, StandardCharsets.UTF_8);
                newPost.setEntity(bodyEntityPost);
              }
              postResp = client.execute(newPost);
              locationHeader = postResp.getFirstHeader("location");
              j++;
            }
            log.info("Number of followed redirections: " + j);
            if (locationHeader != null && j == numMaxRedirects) {
              log.error("The maximum number of redirects (" + numMaxRedirects + ") is exceed.");
            }

            // dump response to out
            byte[] postRespBodyBytes = IOUtils.toByteArray(postResp.getEntity().getContent());
            String res = new String(postRespBodyBytes, StandardCharsets.UTF_8);

            if (postResp.getStatusLine().getStatusCode() == HttpStatus.SC_OK) {
              // PATH_SECURITY_PROXY - AG
              Header[] respHeaders = postResp.getAllHeaders();
              int compSize = postRespBodyBytes.length;
              ArrayList<Header> headerList = new ArrayList<Header>(Arrays.asList(respHeaders));
              String headersString = headerList.toString();
              checkedContent = checkContent(headersString, compSize, serverUrl);
              // FIN_PATH_SECURITY_PROXY - AG
              if (checkedContent) {
                /*
                 * checks if it has requested an getfeatureinfo to modify the response content
                 * type.
                 */
                String requesteredUrl = request.getParameter("url");
                if (GETINFO_PLAIN_REGEX.matcher(requesteredUrl).matches()) {
                  response.setContentType("text/plain");
                } else if (GETINFO_GML_REGEX.matcher(requesteredUrl).matches()) {
                  response.setContentType("application/gml+xml");
                } else if (GETINFO_HTML_REGEX.matcher(requesteredUrl).matches()) {
                  response.setContentType("text/html");
                } else if (requesteredUrl.toLowerCase().contains("apiIdeeop=geosearch")
                        || requesteredUrl.toLowerCase().contains("apiIdeeop=geoprint")) {
                  response.setContentType("application/json");
                } else {
                  response.setContentType("text/xml");
                }
                if (legend) {
                  // old logic
                  String responseBody = res;
                  if (responseBody.contains("ServiceExceptionReport") && serverUrl.contains("LegendGraphic")) {
                    response.sendRedirect("Componente/img/blank.gif");
                  } else {
                    response.setContentLength(responseBody.length());
                    PrintWriter out = response.getWriter();
                    out.print(responseBody);
                    response.flushBuffer();
                  }
                } else {
                  // Patch_AGG 20112505 Prevents IE cache
                  if (request.getProtocol().compareTo("HTTP/1.0") == 0) {
                    response.setHeader("Pragma", "no-cache");
                  } else if (request.getProtocol().compareTo("HTTP/1.1") == 0) {
                    response.setHeader("Cache-Control", "no-cache");
                  }
                  response.setDateHeader("Expires", -1);
                  // END patch
                  // Copy response to output
                  InputStream st = null;
                  try {
                    st = org.apache.commons.io.IOUtils.toInputStream(res, "UTF-8"); 
                    // CHANGED: pass "UTF-8" string instead of StandardCharsets.UTF_8
                    ServletOutputStream sos = response.getOutputStream();
                    IOUtils.copy(st, sos);
                  } finally {
                    if (st != null) st.close();
                  }
                }
              } else {
                strErrorMessage += errorType;
                log.error(strErrorMessage);
              }
            } else if (postResp.getStatusLine().getStatusCode() == HttpStatus.SC_UNAUTHORIZED) {
              response.setStatus(HttpStatus.SC_UNAUTHORIZED);
              Header wh = postResp.getFirstHeader(WWW_AUTHENTICATE);
              if (wh != null) {
                response.addHeader(WWW_AUTHENTICATE, wh.getValue());
              }
            } else {
              strErrorMessage = "Unexpected failure: ".concat(postResp.getStatusLine().toString())
                      .concat(" ").concat(res);
              log.error("Unexpected failure: " + postResp.getStatusLine().toString());
            }
          } catch (Exception e) {
            log.error("Error al tratar el contenido de la peticion: " + e.getMessage(), e);
          } finally {
            if (postResp != null) {
              try { postResp.close(); } catch (IOException ign) {}
            }
            if (client != null) {
              try { client.close(); } catch (IOException ign) {}
            }
          }
        } else {
          // "Processes" logic unchanged
          HttpPost pm = new HttpPost(serverUrl);
          String outputBody;
          CloseableHttpResponse pmResp = null;
          CloseableHttpClient client = null;
          try {
            outputBody = inputStreamAsString(request.getInputStream());
            // CHANGED: Use "UTF-8" string for the 3rd param, not StandardCharsets.UTF_8
            StringEntity requestEntity = new StringEntity(outputBody, "application/json", "UTF-8");
            pm.setEntity(requestEntity);
            pm.addHeader("Content-Type", "application/json");

            client = HttpClientBuilder.create().build();
            pmResp = client.execute(pm);
            int status = pmResp.getStatusLine().getStatusCode();
            if (status == HttpStatus.SC_OK) {
              response.setContentType("application/json");
              InputStream st = pmResp.getEntity().getContent();
              final ServletOutputStream sos = response.getOutputStream();
              IOUtils.copy(st, sos);
            } else if (status == HttpStatus.SC_UNAUTHORIZED) {
              response.setStatus(HttpStatus.SC_UNAUTHORIZED);
              Header wh = pmResp.getFirstHeader(WWW_AUTHENTICATE);
              if (wh != null) {
                response.addHeader(WWW_AUTHENTICATE, wh.getValue());
              }
            } else {
              // CHANGED: pass "UTF-8" string
              String failBody = IOUtils.toString(pmResp.getEntity().getContent(), "UTF-8");
              strErrorMessage = "Unexpected failure: ".concat(pmResp.getStatusLine().toString())
                  .concat(" ").concat(failBody);
              log.error("Unexpected failure: " + pmResp.getStatusLine().toString());
            }
          } catch (IOException e) {
            log.error("Error al tratar el contenido de la peticion: " + e.getMessage(), e);
          } finally {
            if (pmResp != null) {
              try { pmResp.close(); } catch (IOException ign) {}
            }
            if (client != null) {
              try { client.close(); } catch (IOException ign) {}
            }
          }
        }
      } else {
        strErrorMessage += "Only HTTP(S) protocol supported";
        log.error("Only HTTP(S) protocol supported");
        // throw new
        // ServletException("only HTTP(S) protocol supported");
      }
    }
    // There are errors.
    if (!strErrorMessage.equals("") || serverUrl.equals("ERROR")) {
      if (strErrorMessage.equals("")) {
        strErrorMessage = "Error en el parametro url de entrada";
      }
      String errorXML = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><error><descripcion>" + strErrorMessage
          + "</descripcion></error>";
      response.setContentType("text/xml");
      try {
        PrintWriter out = response.getWriter();
        out.print(errorXML);
        response.flushBuffer();
      } catch (Exception e) {
        log.error(e);
      }
    }
    log.info("-------- End POST method --------");
}

  /***************************************************************************
  * inputStreamAsString
  **************************************************************************/
  public static String inputStreamAsString(InputStream stream) throws IOException {
    BufferedReader br = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
    StringBuilder sb = new StringBuilder();
    String line = null;
    while ((line = br.readLine()) != null) {
      sb.append(line + "\n");
    }
    br.close();
    return sb.toString();
  }

  /*************************************************************************************
  * checkContentMethodPost - Check content's type and content's length for post
  * request
  *************************************************************************************/
  private boolean checkContent(String headersString, int compSize, String serverUrl) {
    boolean resp;
    serverUrl = serverUrl.toUpperCase();
    // Check content's type is xml
    headersString = headersString.toLowerCase();
    if (headersString.contains("content-type") && (headersString.contains("xml")
    || headersString.contains("image/png") || headersString.contains("gml")
    || headersString.contains("plain") || headersString.contains("html") || headersString.contains("json")
    || headersString.contains("wms_xml"))) {
      resp = true;
    } else if (serverUrl.contains("KML")) {
      // KML
      String[] tokens = serverUrl.split("\\&");
      int numTokens = tokens.length;
      if (numTokens == 1) {
        // Check if the beginning is http
        String protocol = serverUrl.toUpperCase().substring(0, 4);
        // Check if the ending is kml
        String extension = serverUrl.toUpperCase().substring(serverUrl.length() - 3, serverUrl.length());
        if (!protocol.equals("HTTP") || !extension.equals("KML")) {
          errorType = "Error en el parametro url de entrada";
          resp = false;
        } else {
          resp = true;
        }
      } else {
        errorType = "Error en el parametro url de entrada";
        resp = false;
      }
    } else {
      errorType = "Error en el contentType de la respuesta";
      resp = false;
    }
    return resp;
  }

  /***************************************************************************
  * checkTypeRequest - Check the serverurl format.
  **************************************************************************/
  private String checkTypeRequest(String serverUrl) {
    String serverUrlChecked = "ERROR";
    if (serverUrl.contains("&apiIdeeop=wmc")) {
      serverUrlChecked = serverUrl.replaceAll("&apiIdeeop=wmc", "");
      // Check if the beginning is http(s)
      String protocol = serverUrlChecked.toUpperCase().substring(0, 4);
      if (!protocol.equalsIgnoreCase("HTTP") && !protocol.equalsIgnoreCase("HTTPS")) {
        log.debug("ProxyRedirect (apiIdeeop=wmc) - Protocol=" + protocol);
        serverUrlChecked = "ERROR";
      }
    } else if (serverUrl.contains("&apiIdeeop=kml")) {
      serverUrlChecked = serverUrl.replaceAll("&apiIdeeop=kml", "");
      // Check if the beginning is http
      String protocol = serverUrlChecked.toUpperCase().substring(0, 4);
      if (!protocol.equalsIgnoreCase("HTTP") && !protocol.equalsIgnoreCase("HTTPS")) {
        log.debug("ProxyRedirect (apiIdeeop=kml) - Protocol=" + protocol);
        serverUrlChecked = "ERROR";
      }
    } else if (serverUrl.contains("&apiIdeeop=wmsfull")) {
      serverUrlChecked = serverUrl.replaceAll("&apiIdeeop=wmsfull", "");
      String[] tokens = serverUrlChecked.split("\\&");
      int numTokens = tokens.length;
      if (numTokens == 3) {
        // Check if the beginning is http
        String protocol = tokens[0].toUpperCase().substring(0, 4);
        if (!protocol.equals("HTTP")) {
          serverUrlChecked = "ERROR";
          log.debug("ProxyRedirect (apiIdeeop=wmsfull) - Protocol=" + protocol);
        }
        if (!tokens[1].equals("service=WMS") || !tokens[2].equals("request=GetCapabilities")) {
          serverUrlChecked = "ERROR";
          log.debug("ProxyRedirect (apiIdeeop=wmsfull) - service=" + tokens[1] + " request=" + tokens[2]);
        } else {
          serverUrlChecked = tokens[0] + "&service=WMS&request=GetCapabilities";
        }
      } else {
        log.debug("ProxyRedirect (apiIdeeop=wmsfull) - Error en el número de parámetros");
        serverUrlChecked = "ERROR";
      }
    } else if (serverUrl.contains("apiIdeeop=wmsinfo")) { // GET
      serverUrlChecked = serverUrl.replaceAll("&apiIdeeop=wmsinfo", "");
      serverUrlChecked = serverUrlChecked.replaceAll("apiIdeeop=wmsinfo", "");
      String[] tokens = serverUrlChecked.split("\\&");
      int numTokens = tokens.length;
      if (numTokens == 3) { // GetCapabilities
        // Check if the beginning is http
        String protocol = tokens[0].toUpperCase().substring(0, 4);
        if (!protocol.equals("HTTP")) {
          serverUrlChecked = "ERROR";
          log.debug("ProxyRedirect (apiIdeeop=wmsinfo) - Protocol=" + protocol);
        }
        if (!tokens[1].equals("service=WMS") || !tokens[2].equals("request=GetCapabilities")) {
          serverUrlChecked = "ERROR";
          log.debug("ProxyRedirect (apiIdeeop=wmsinfo) - service=" + tokens[1] + " request=" + tokens[2]);
        } else {
          serverUrlChecked = tokens[0] + "service=WMS&request=GetCapabilities";
        }
      }
    } else if (serverUrl.contains("apiIdeeop=geosearch")) {
      serverUrlChecked = serverUrl.replaceAll("&apiIdeeop=geosearch", "");
      // Check if the beginning is http
      String protocol = serverUrlChecked.toUpperCase().substring(0, 4);
      if (!protocol.equalsIgnoreCase("HTTP") && !protocol.equalsIgnoreCase("HTTPS")) {
        log.debug("ProxyRedirect (apiIdeeop=geosearch) - Protocol=" + protocol);
        serverUrlChecked = "ERROR";
      }
    } else if (serverUrl.toLowerCase().contains("legendgraphic")) {
      serverUrlChecked = serverUrl;
    } else if ((serverUrl.toLowerCase().contains("wfst")) || (serverUrl.toLowerCase().contains("wfs"))
    || (serverUrl.toLowerCase().contains("ows"))) {
      serverUrlChecked = serverUrl;
    } else if (serverUrl.toLowerCase().contains("getcapabilities")) {
      serverUrlChecked = serverUrl;
    } else if (serverUrl.toLowerCase().contains("wsdl")) {
      soap = true;
      serverUrl = serverUrl.replace("?wsdl", "");
      serverUrlChecked = serverUrl;
    } else if (serverUrl.toLowerCase().contains("apiIdeeop=geoprint")) {
      serverUrlChecked = serverUrl.replaceAll("\\&?\\??apiIdeeop=geoprint", "");
    } else if (serverUrl.toLowerCase().contains("/processes/")) {
      serverUrlChecked = serverUrl;
    }

    return serverUrlChecked;
  }
}
