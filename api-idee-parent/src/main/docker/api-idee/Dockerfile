FROM tomcat:7.0.104-jdk8
MAINTAINER Jesús Díaz <jesusdiaz@guadaltel.com>

ADD api-idee.war $CATALINA_HOME/webapps/api-idee.war
RUN rm -rf $CATALINA_HOME/conf/server.xml
ADD server.xml $CATALINA_HOME/conf/server.xml

EXPOSE 8080
