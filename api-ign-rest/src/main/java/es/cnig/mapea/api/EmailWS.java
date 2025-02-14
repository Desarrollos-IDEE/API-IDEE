package es.cnig.mapea.api;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringWriter;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.ResourceBundle;

import javax.activation.DataHandler;
import javax.activation.FileDataSource;
import javax.mail.BodyPart;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.servlet.ServletContext;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import com.sun.jersey.core.header.FormDataContentDisposition;
import com.sun.jersey.multipart.FormDataParam;

import es.cnig.mapea.builder.JSBuilder;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;


/**
 * This class manages the available actions an user can execute
 *
 * @author Guadaltel S.A.
 */
@Path("/email")
@Produces("application/javascript")
public class EmailWS {

   @Context
   private ServletContext context;

   private ResourceBundle configProperties = ResourceBundle.getBundle("configuration");

   /**
    * Send email
    *
    * @param callbackFn the name of the javascript
    * function to execute as callback
    *
    * @return the javascript code
    */
   @POST
   @Consumes(MediaType.MULTIPART_FORM_DATA)
   public String sendEmail (@QueryParam("callback") String callback, @FormDataParam("subject") String subject,
		   @FormDataParam("mailto") String mailto, @FormDataParam("body") String body,
		   @FormDataParam("file") InputStream fileStream, @FormDataParam("file") FormDataContentDisposition fileDetail) {
      JSONObject msg = new JSONObject();
      String message = "Email enviado correctamente";
      File file = createFile(fileStream, fileDetail);
      String identifier = String.valueOf(new Date().getTime());
      String error = sendEmailSMTP(mailto, subject, body, file, identifier);
      if(error != null && !error.isEmpty()){
    	  message = error;
      }
      if(file != null){
    	  file.delete();
      }
      msg.put("message", message);
      return JSBuilder.wrapCallback(msg, callback);
   }

   private File createFile(InputStream fileStream, FormDataContentDisposition fileDetail){
	   File file = null;
	   if(fileStream != null && fileDetail != null &&
			   fileDetail.getFileName() != null && !fileDetail.getFileName().isEmpty()){
		   try {
			    String fileName = fileDetail.getFileName();
			    int index = fileName.lastIndexOf(".");
			    String prefix = fileName.substring(0, index);
			    String suffix = fileName.substring(index+1);
			    file = File.createTempFile(prefix, "." + suffix);
				OutputStream out = new FileOutputStream(file);
				int read = 0;
				byte[] bytes = new byte[1024];
				while ((read = fileStream.read(bytes)) != -1) {
					out.write(bytes, 0, read);
				}
				out.flush();
				out.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
	   }
	   return file;
   }
   
   private File createGeoJSONFile(String geojson, String identifier){
	   String nameFile = "incidencia_" + identifier;
	   File file = null;
		try {
			file = File.createTempFile(nameFile, ".geojson");
			FileUtils.writeStringToFile(file, geojson);
		} catch (IOException e) {
			e.printStackTrace();
		}
	   return file;
   }

   private String sendEmailSMTP(String destinatario, String asunto, String cuerpo, File fichAdjunto, String identifier){
	   String result = null;
	   // Esto es lo que va delante de @gmail.com en tu cuenta de correo. Es el remitente también.
	   String remitente = configProperties.getString("smtp.remitente");
	   String usuario = configProperties.getString("smtp.user");
	   String host = configProperties.getString("smtp.host");
	   String password = configProperties.getString("smtp.password");
	   String port = configProperties.getString("smtp.port");

	   Properties props = new Properties();
	   props.put("mail.smtp.host", host);//El servidor SMTP
	   props.put("mail.smtp.starttls.enable", "true"); //Para conectar de manera segura al servidor SMTP
	   if (usuario != null && !usuario.isEmpty() && password != null && !password.isEmpty()) {
		   props.put("mail.smtp.auth", "true");//Usar autenticación mediante usuario y clave
	   }

	   if (port != null && !port.isEmpty()) {
		   props.put("mail.smtp.port", port);//El puerto SMTP
	   }

	   Session session = Session.getDefaultInstance(props);
	   MimeMessage message = new MimeMessage(session);
	   Transport transport = null;
	   try {
		   message.addHeader("Access-Control-Allow-Origin", "*");
		   message.setFrom(new InternetAddress(remitente));
		   message.addRecipient(Message.RecipientType.TO, new InternetAddress(destinatario)); //Se podrían añadir varios de la misma manera
		   message.setSubject(asunto);
		   JSONObject body = new JSONObject(cuerpo);
		   JSONArray jsonArray = body.getJSONArray("features");
		   JSONObject jsonFeature = jsonArray.getJSONObject(0);
		   JSONObject properties = jsonFeature.getJSONObject("properties");
		   String shareURL = properties.getString("URL");
		   String apiURL = properties.getString("API_URL");
		   Map<String, Object> data = new HashMap<String, Object>();
		   data.put("subject", asunto);
		   data.put("destinatary", destinatario);
		   data.put("sendername", properties.getString("emailName"));
		   data.put("senderemail", properties.getString("emailUser"));
		   data.put("errDescription", properties.getString("errDescripcion"));
		   data.put("apiURL", apiURL);
		   if(properties.getString("URL").equals("")) {
			data.put("shareURL", "");
			data.put("contentURL", "");
		   } else {
			data.put("shareURL", shareURL);
			data.put("contentURL", "URL Visualizador: ");
		   }
		   //data.put("sendergeometry", cuerpo);
		   String bodyData = getTemplate(data);
		   BodyPart adjunto = new MimeBodyPart();
		   properties.remove("URL");
		   properties.remove("API_URL");
		   properties.put("url", shareURL); // ?¿
		   jsonFeature.put("properties", properties);
		   jsonArray.put(0, jsonFeature);
		   body.put("features", jsonArray);
		   File geojsonFile = createGeoJSONFile(body.toString(), identifier);
		   adjunto.setDataHandler(new DataHandler(new FileDataSource(geojsonFile)));
		   String newName = geojsonFile.getName().split(identifier)[0] + identifier + ".geojson";
		   adjunto.setFileName(newName);
		   BodyPart texto = new MimeBodyPart();
		   texto.setContent(bodyData, "text/html; charset=utf-8");
		   MimeMultipart multiparte = new MimeMultipart();
		   multiparte.addBodyPart(adjunto);
		   if (fichAdjunto != null) {
			   BodyPart adjunto2 = new MimeBodyPart();
			   adjunto2.setDataHandler(new DataHandler(new FileDataSource(fichAdjunto)));
			   String[] splittedName = fichAdjunto.getName().split("\\.");
			   adjunto2.setFileName("adjunto_" + identifier + "." + splittedName[splittedName.length - 1]);
			   multiparte.addBodyPart(adjunto2);
		   }

		   multiparte.addBodyPart(texto);
		   message.setContent(multiparte);
		   transport = session.getTransport("smtp");
		   if (usuario != null && !usuario.isEmpty() && password != null && !password.isEmpty()) {
			   transport.connect(host, usuario, password);
		   } else {
			   transport.connect();
		   }

		   transport.sendMessage(message, message.getAllRecipients());
	   } catch (Exception me) {
		   System.out.println(me);
		   me.printStackTrace();
		   result = me.getMessage();
	   } finally {
		   if(transport != null){
			   try {
				   transport.close();
			   } catch (Exception me2) {
				   System.out.println(me2);
				   me2.printStackTrace();
			   }
		   }
	   }
	   return result;
   }

   private static String getTemplate(Map<String, Object> data) {
		String result = null;
		@SuppressWarnings("deprecation")
		Configuration cfg = new Configuration();
		cfg.setClassForTemplateLoading(EmailWS.class, "/");
		Template template;
		try {
			template = cfg.getTemplate("email.ftl");
			StringWriter out = new StringWriter();
			template.process(data, out);
			out.flush();
			result = out.toString();
		} catch (IOException e) {
			e.printStackTrace();
		} catch (TemplateException e) {
			e.printStackTrace();
		}

		return result;
	}
}
