pipeline {
    agent any

    environment {
        MAIL_PASSWORD     = credentials('MAIL_PASSWORD')
        GROQ_SERVER       = credentials('GROQ_SERVER')
        DISCORD_BOT_TOKEN = credentials('DISCORD_BOT_TOKEN')
        HF_TOKEN          = credentials('HF_TOKEN')
        SONAR_TOKEN       = credentials('SONAR_TOKEN')
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'dockerized-version',
                    url: 'https://github.com/theBrowski12/SimoVite_Ai.git'
            }
        }

        stage('Code Quality — SonarCloud') {
            steps {
                withSonarQubeEnv('SonarCloud') {
                    sh '''
                        for service in Gateway_service Order_Service Delivery_Service Catalog_Service Notification_Service; do
                            echo "🔍 Analysing $service..."
                            cd $service
                            mvn sonar:sonar \
                                -Dsonar.organization=theBrowski12 \
                                -Dsonar.projectKey=simovite-$service \
                                -Dsonar.projectName="SimoVite $service" \
                                -Dsonar.host.url=https://sonarcloud.io \
                                -Dsonar.token=$SONAR_TOKEN \
                                -DskipTests
                            cd ..
                        done
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Stop Old Containers') {
            steps {
                sh 'docker-compose down || true'
            }
        }

        stage('Build & Start') {
            steps {
                sh '''
                    export MAIL_PASSWORD=$MAIL_PASSWORD
                    export GROQ_SERVER=$GROQ_SERVER
                    export DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
                    export HF_TOKEN=$HF_TOKEN
                    docker-compose up -d --build
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh 'sleep 30'
                sh 'docker ps'
                sh 'curl -f http://localhost:8761/actuator/health || echo "Discovery not ready yet"'
                sh 'curl -f http://localhost:8888/actuator/health || echo "Gateway not ready yet"'
            }
        }
    }

    post {
        success {
            mail(
                to: 'mohamedbenbouazza1998@gmail.com',
                subject: "SimoVite Build #${env.BUILD_NUMBER} Success",
                body: "The build succeeded!"
            )
        }
        failure {
            mail(
                to: 'mohamedbenbouazza1998@gmail.com',
                subject: "SimoVite Build #${env.BUILD_NUMBER} Failed",
                body: "The build failed! Check logs: ${env.BUILD_URL}console"
            )
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}
