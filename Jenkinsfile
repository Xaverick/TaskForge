// ─────────────────────────────────────────────────────────────────────────────
// Jenkinsfile — Microservices Production CI/CD
//
// Branch strategy:
//   main    -> namespace "microservices"          (prod)  -> host: app.<LB_IP>.nip.io
//   develop -> namespace "microservices-staging"  (staging) -> host: staging.<LB_IP>.nip.io
//
// Prerequisites (Jenkins -> Manage Jenkins -> Credentials -> System -> Global):
//   - ghcr-credentials  : Username/Password (GitHub username + PAT, write:packages)
//   - jwt-secret-value  : Secret Text (raw JWT secret string)
//
// kubeconfig is read from the jenkins user's ~/.kube/config (already configured)
// ─────────────────────────────────────────────────────────────────────────────

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    parameters {
        booleanParam(
            name: 'BOOTSTRAP_DATA_TIER',
            defaultValue: false,
            description: 'Deploy MongoDB + Redis StatefulSets (only needed first time per namespace)'
        )
    }

    environment {
        REGISTRY        = "ghcr.io"
        GITHUB_USERNAME = "xaverick"
        IMAGE_PREFIX    = "${REGISTRY}/${GITHUB_USERNAME}"

        AUTH_IMAGE      = "${IMAGE_PREFIX}/microservices-auth-service"
        TASK_IMAGE      = "${IMAGE_PREFIX}/microservices-task-service"
        FRONTEND_IMAGE  = "${IMAGE_PREFIX}/microservices-frontend"

        IMAGE_TAG       = "${GIT_COMMIT.take(7)}-${BUILD_NUMBER}"
        LB_IP           = "38.248.14.181"
    }

    stages {

        // ── 1. CHECKOUT ───────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Resolve namespace + host based on branch
                    if (env.BRANCH_NAME == 'main') {
                        env.K8S_NAMESPACE = 'microservices'
                        env.APP_HOST      = "app.${LB_IP}.nip.io"
                    } else if (env.BRANCH_NAME == 'develop') {
                        env.K8S_NAMESPACE = 'microservices-staging'
                        env.APP_HOST      = "staging.${LB_IP}.nip.io"
                    } else {
                        env.K8S_NAMESPACE = "microservices-${env.BRANCH_NAME.toLowerCase().replaceAll('[^a-z0-9-]','-')}"
                        env.APP_HOST      = "${env.BRANCH_NAME}.${LB_IP}.nip.io"
                    }

                    echo """
                    ════════════════════════════════════════
                      Branch     : ${env.BRANCH_NAME}
                      Namespace  : ${env.K8S_NAMESPACE}
                      Host       : ${env.APP_HOST}
                      Image tag  : ${env.IMAGE_TAG}
                    ════════════════════════════════════════
                    """
                }
            }
        }

        // ── 2. LINT ────────────────────────────────────────────────────────────
        stage('Lint') {
            parallel {
                stage('Auth Service') {
                    steps {
                        dir('backend/auth-service') {
                            sh 'npm ci --silent'
                        }
                    }
                }
                stage('Task Service') {
                    steps {
                        dir('backend/task-service') {
                            sh 'npm ci --silent'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                npm ci --silent
                                npm run lint
                            '''
                        }
                    }
                }
            }
        }

        // ── 3. BUILD IMAGES (parallel) ───────────────────────────────────────────
        stage('Build Images') {
            parallel {
                stage('Auth Service') {
                    steps {
                        dir('backend/auth-service') {
                            sh "docker build -t ${AUTH_IMAGE}:${IMAGE_TAG} ."
                        }
                    }
                }
                stage('Task Service') {
                    steps {
                        dir('backend/task-service') {
                            sh "docker build -t ${TASK_IMAGE}:${IMAGE_TAG} ."
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ."
                        }
                    }
                }
            }
        }

        // ── 4. PUSH TO GHCR ───────────────────────────────────────────────────
        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'GHCR_USER',
                    passwordVariable: 'GHCR_TOKEN'
                )]) {
                    sh '''
                        echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin

                        for img in ${AUTH_IMAGE} ${TASK_IMAGE} ${FRONTEND_IMAGE}; do
                            docker push ${img}:${IMAGE_TAG}
                            docker tag  ${img}:${IMAGE_TAG} ${img}:latest-${BRANCH_NAME}
                            docker push ${img}:latest-${BRANCH_NAME}
                        done
                    '''
                }
            }
        }

        // ── 5. NAMESPACE + SECRETS ────────────────────────────────────────────
        stage('Ensure Namespace & Secrets') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'ghcr-credentials',
                        usernameVariable: 'GHCR_USER',
                        passwordVariable: 'GHCR_TOKEN'
                    ),
                    string(credentialsId: 'jwt-secret-value', variable: 'JWT_SECRET_VAL')
                ]) {
                    sh '''
                        # Create namespace if it doesn't exist
                        kubectl get namespace ${K8S_NAMESPACE} || \
                            kubectl create namespace ${K8S_NAMESPACE}

                        # GHCR pull secret (idempotent)
                        kubectl create secret docker-registry ghcr-secret \
                            --namespace=${K8S_NAMESPACE} \
                            --docker-server=ghcr.io \
                            --docker-username=${GHCR_USER} \
                            --docker-password=${GHCR_TOKEN} \
                            --dry-run=client -o yaml | kubectl apply -f -

                        # JWT secret (idempotent)
                        kubectl create secret generic jwt-secret \
                            --namespace=${K8S_NAMESPACE} \
                            --from-literal=JWT_SECRET="${JWT_SECRET_VAL}" \
                            --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }

        // ── 6. CONFIGMAPS ─────────────────────────────────────────────────────
        stage('Apply ConfigMaps') {
            steps {
                sh '''
                    sed "s/__NS__/${K8S_NAMESPACE}/g; s/__HOST__/${APP_HOST}/g" \
                        k8s/configmaps.yaml | kubectl apply -f -
                '''
            }
        }

        // ── 7. DATA TIER (MongoDB + Redis) — only when requested ─────────────
        stage('Bootstrap Data Tier') {
            when {
                expression { params.BOOTSTRAP_DATA_TIER == true }
            }
            steps {
                sh '''
                    echo "=== Deploying MongoDB StatefulSet ==="
                    sed "s/__NS__/${K8S_NAMESPACE}/g" k8s/mongodb.yaml | kubectl apply -f -

                    echo "=== Deploying Redis StatefulSet ==="
                    sed "s/__NS__/${K8S_NAMESPACE}/g" k8s/redis.yaml | kubectl apply -f -

                    echo "=== Waiting for MongoDB pods ==="
                    kubectl rollout status statefulset/mongodb --namespace=${K8S_NAMESPACE} --timeout=240s

                    echo "=== Waiting for Redis pod ==="
                    kubectl rollout status statefulset/redis --namespace=${K8S_NAMESPACE} --timeout=120s

                    echo "=== Checking MongoDB replica set status ==="
                    sleep 15
                    kubectl exec -n ${K8S_NAMESPACE} mongodb-0 -- mongosh --quiet --eval "rs.status().ok" || \
                        echo "Replica set not yet initialized — init job will handle it"
                '''
            }
        }

        // ── 8. DEPLOY SERVICES ────────────────────────────────────────────────
        stage('Deploy Services') {
            steps {
                sh '''
                    # Services (ClusterIP for auth/task/frontend)
                    sed "s/__NS__/${K8S_NAMESPACE}/g" k8s/services.yaml | kubectl apply -f -

                    # Deployments — substitute namespace, image repo, and tag
                    for svc in auth-service task-service frontend; do
                        sed "s/__NS__/${K8S_NAMESPACE}/g; \
                             s|IMAGE_TAG|${IMAGE_TAG}|g; \
                             s|<GITHUB_USERNAME>|${GITHUB_USERNAME}|g" \
                            k8s/${svc}.yaml | kubectl apply -f -
                    done

                    # Ingress
                    sed "s/__NS__/${K8S_NAMESPACE}/g; s/__HOST__/${APP_HOST}/g" \
                        k8s/ingress.yaml | kubectl apply -f -

                    # HPA (requires metrics-server)
                    sed "s/__NS__/${K8S_NAMESPACE}/g" k8s/hpa.yaml | kubectl apply -f - || \
                        echo "HPA apply failed — metrics-server may not be installed (non-fatal)"
                '''
            }
        }

        // ── 9. VERIFY ROLLOUT ─────────────────────────────────────────────────
        stage('Verify Rollout') {
            steps {
                sh '''
                    echo "=== Rolling out deployments ==="
                    kubectl rollout status deployment/auth-service   --namespace=${K8S_NAMESPACE} --timeout=150s
                    kubectl rollout status deployment/task-service   --namespace=${K8S_NAMESPACE} --timeout=150s
                    kubectl rollout status deployment/frontend       --namespace=${K8S_NAMESPACE} --timeout=150s

                    echo "=== Pods ==="
                    kubectl get pods -n ${K8S_NAMESPACE} -o wide

                    echo "=== Ingress ==="
                    kubectl get ingress -n ${K8S_NAMESPACE}
                '''
            }
        }

        // ── 10. SMOKE TEST ────────────────────────────────────────────────────
        stage('Smoke Test') {
            steps {
                sh '''
                    AUTH_POD=$(kubectl get pods -n ${K8S_NAMESPACE} -l app=auth-service -o jsonpath='{.items[0].metadata.name}')
                    TASK_POD=$(kubectl get pods -n ${K8S_NAMESPACE} -l app=task-service -o jsonpath='{.items[0].metadata.name}')

                    echo "=== auth-service /health ==="
                    kubectl exec -n ${K8S_NAMESPACE} ${AUTH_POD} -- wget -qO- http://localhost:4000/health

                    echo ""
                    echo "=== task-service /health ==="
                    kubectl exec -n ${K8S_NAMESPACE} ${TASK_POD} -- wget -qO- http://localhost:5000/health
                '''
            }
        }
    }

    post {
        success {
            echo """
            ╔══════════════════════════════════════════════╗
            ║  DEPLOY SUCCEEDED                             ║
            ║  Branch    : ${env.BRANCH_NAME}
            ║  Namespace : ${env.K8S_NAMESPACE}
            ║  URL       : http://${env.APP_HOST}
            ║  Tag       : ${env.IMAGE_TAG}
            ╚══════════════════════════════════════════════╝
            """
        }

        failure {
            echo "Pipeline FAILED — rolling back deployments in ${env.K8S_NAMESPACE}"
            sh '''
                kubectl rollout undo deployment/auth-service --namespace=${K8S_NAMESPACE} || true
                kubectl rollout undo deployment/task-service --namespace=${K8S_NAMESPACE} || true
                kubectl rollout undo deployment/frontend     --namespace=${K8S_NAMESPACE} || true

                echo "=== Post-rollback pods ==="
                kubectl get pods -n ${K8S_NAMESPACE}
            '''
        }

        always {
            sh '''
                docker rmi ${AUTH_IMAGE}:${IMAGE_TAG}     || true
                docker rmi ${TASK_IMAGE}:${IMAGE_TAG}     || true
                docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} || true
            '''
        }
    }
}