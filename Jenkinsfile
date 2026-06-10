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
                    bat '''
                        for %%S in (Gateway_service Order_Service Delivery_Service Catalog_Service Notification_Service) do (
                            echo "🔍 Analysing %%S..."
                            cd %%S
                            call mvn sonar:sonar -Dsonar.organization=BenBouazzaMohamed -Dsonar.projectKey=simovite-%%S -Dsonar.projectName="SimoVite %%S" -Dsonar.host.url=https://sonarcloud.io -Dsonar.token=%SONAR_TOKEN% -DskipTests
                            cd ..
                        )
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
                bat 'docker-compose down || exit 0'
            }
        }

        stage('Build & Start') {
            steps {
                bat '''
                    set MAIL_PASSWORD=%MAIL_PASSWORD%
                    set GROQ_SERVER=%GROQ_SERVER%
                    set DISCORD_BOT_TOKEN=%DISCORD_BOT_TOKEN%
                    set HF_TOKEN=%HF_TOKEN%
                    docker-compose up -d
                '''
            }
        }

        stage('Health Check') {
            steps {
                bat 'timeout /t 30 /nobreak > NUL'
                bat 'docker ps'
                bat 'curl -f http://localhost:8761/actuator/health || echo "Discovery not ready yet"'
                bat 'curl -f http://localhost:8888/actuator/health || echo "Gateway not ready yet"'
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
            bat 'docker image prune -f || exit 0'
        }
    }
}
