---
sidebar_position: 8
title: Google Cloud Build
description: Google Cloud Build is a serverless CI/CD platform that executes builds on Google Cloud Platform infrastructure with advanced build automation and deployment capabilities.
slug: /CI-CD/CloudBuild
keywords:
  - Google Cloud Build
  - GCP CI/CD
  - cloud native CI/CD
  - container builds
  - serverless CI/CD
  - Google Cloud Platform
  - build automation
  - deployment pipeline
  - cloud builds
  - GCP DevOps
---

# ☁️ Serverless CI/CD with Google Cloud Build

**Google Cloud Build** is a **serverless CI/CD platform** that executes builds on **Google Cloud Platform infrastructure** with **automatic scaling**, **parallel execution**, and **deep GCP integration**. Perfect for **container builds**, **multi-language applications**, and **cloud-native deployments**.

## Key Features

- **Serverless Architecture**: No infrastructure management required
- **Parallel Execution**: Run build steps concurrently for faster builds
- **Deep GCP Integration**: Native integration with GCP services
- **Custom Build Steps**: Extensible with custom builders and Docker images
- **Security**: Built-in vulnerability scanning and secret management

## Use Cases

- **Container Applications**: Build and deploy to GKE, Cloud Run, and Anthos
- **Serverless Functions**: Build and deploy Cloud Functions and Cloud Run functions
- **Multi-Language Projects**: Support for Node.js, Python, Java, Go, and more
- **Infrastructure as Code**: Terraform and deployment automation

---

## 🧰 Prerequisites

- **Google Cloud Project** with billing enabled
- **gcloud CLI** installed and configured
- **Docker** for local testing (optional)
- **Git repository** connected to Cloud Build
- **Required APIs** enabled (Cloud Build, Container Registry, etc.)

---

## 🔧 Step 1: Setup Google Cloud Build

### Enable Required APIs and Setup

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create myapp-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for myapp"

# Grant Cloud Build service account necessary permissions
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/container.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

---

## 🏗️ Step 2: Comprehensive Build Configuration

Create a comprehensive `cloudbuild.yaml`:

```yaml
# Google Cloud Build Configuration
# This file defines a complete CI/CD pipeline with multiple stages

# Substitutions for dynamic values
substitutions:
  _SERVICE_NAME: myapp
  _REGION: us-central1
  _CLUSTER_NAME: production-cluster
  _CLUSTER_ZONE: us-central1-a
  _DEPLOY_ENV: staging

# Build steps
steps:
  # Step 1: Restore dependencies cache
  - name: 'gcr.io/cloud-builders/gsutil'
    id: 'restore-cache'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gsutil -m cp -r gs://${PROJECT_ID}-build-cache/node_modules . || echo "No cache found"
    waitFor: ['-']

  # Step 2: Install dependencies
  - name: 'node:18-alpine'
    id: 'install-deps'
    entrypoint: 'npm'
    args: ['ci']
    env:
      - 'NODE_ENV=development'
    waitFor: ['restore-cache']

  # Step 3: Save dependencies cache
  - name: 'gcr.io/cloud-builders/gsutil'
    id: 'save-cache'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gsutil -m cp -r node_modules gs://${PROJECT_ID}-build-cache/
    waitFor: ['install-deps']

  # Step 4: Run linting
  - name: 'node:18-alpine'
    id: 'lint'
    entrypoint: 'npm'
    args: ['run', 'lint']
    waitFor: ['install-deps']

  # Step 5: Run unit tests
  - name: 'node:18-alpine'
    id: 'test-unit'
    entrypoint: 'npm'
    args: ['run', 'test:coverage']
    env:
      - 'CI=true'
      - 'NODE_=test'
    waitFor: ['install-dep

  # Step 6: Run it
  - name: 'node:1ne'
    id: 'securitit'
    entrypoint: 'npm'
    args: ['audit', '--audit-l']


  # Step 7: Build application
  - name: 'node:18-alpine'
    id: 'build-app'
   pm'

   env:
ion'
    waitFor: ['lint',t']

  # Step 8: Build Docker image
ker'
    id: 'build-image'
    args:
      - 'build'
'-t'
      - 'us-central1-docke
      - '-t'
      - ''
      - '--caom'
      - 'u
      - 'uild-arg'
      - 
'.'
    waitFor: ['build-app'

  # Step 9: Push Dr image
  - name: 'gcr
    id: 'push-image'
    args:
h'
      - '--all-tags'
      - 'us-centra}'


  #y

    id: 'security-scan'
    args:
      '
      - '--exit-code'
      - '1'
      - '--severity'
      - 'HIGH,CRITICAL'
      - 't'
     - 'json'
      - '--output'

      -A}'
    waitFor: ['push-image']


  - name: 'gcr.io/cloud-builoud'
ging'
    args:
      - 'run'
      - 'deploy'
taging'
      - '--image'
      - 'u_SHA}'
      - '-on'
      - ION}'
      -
aged'
      - '--allow-unauthe
      - '--set-env-vars'
      - 'NODE_ENV=staging,VERSION=${COMMIT_SHA}'

      - '512Mi'
      - '--cpu'
- '1'
      - '--max-instances'
   0'

      - '80'
    wai-scan']

  # Ststs

    id: 'integration-tests'

    args:
      - '-c'
      - |

        SERVICE_URL)
        
        # Wait for service to be ready
}; do
          if curl -f "$SERVICE_URL/health"; then
   "

   fi
"
          sleep 10
e
        

        curl -f "$SERVICE_URL/api/test" || 
       "
    waitFor: ['deploy-staging

  #nch
  - nam
    id: 'deploy-production'
    args:
      - 'run'
/'
     A}'
      - '--clu
      - '--location=${_CLUZONE}'
    n'
    waitFoon-tests']

  # tion
  - name: 'gcr.il'
    id: 'smoke-tests'
    args:
      - 'run'
    
      - '--image=curlimages/cu
      - '--rm'
    
      - '--'
      - 'curl'
      - '-f'
      - 'http://${_SERVICE_NAME}.prolth'
    env:
   ER_ZONE}'
NAME}'
    waitFor: ['deploy-pro

  # Step 15: Notify Slack on succe
  - nal'
    id: 'notify-success'
    entrypoint: 'bash'
    args:
  
      - |
        curl -X POSson' \
        --data "{\""}" \
        $$
    secretEnv: ['SLACK_
    w

# o store
artifacts:
  jects:
    location: 'gs:/s'
    paths:
      - 'trivy-report.json'
   '
  

#

  - 'us-central1-docker.pkg.dev/${PROJECT_ISHA}'
  - 'us-central1-docker.pkg.dev/${

# anager
availableS
  secretManager:
    - versionName: 
      env: 'SLACK_'
    - versionName: projest
     

# 
options:
  
  diskSizeGb: 100
  substitution_option: 'ALL
  l_ONLY
 N
  d true

# Te build
'
```

---

## ▶️ Step 3: Advanced Build Patterns

### Muld

Create `cloudbuild-monorepo.yaml`:

```yaml
steps:
  # Detect changed services
  - name: 'gcr.io/clou/git'
    id: ''
    entrypoi
    args:
      - '-c'
      - |
        # Get list of changed files
        git diff --name-only HEAD~1 
        
        # Detect 
        echo "fr
        echo "backend=false" >> build_flags.env
        echo "api=false" >> bus.env
    
n
          echo "fv

        
        i
          echo "backenv
        fi
        
        if txt; then
env
        fi
        
        cat build_flags.env

  # nal)
  - name: 'node:18-alpine'
    id: 'build-frontend'
    entrypoint: 'bash'
    args:
      - '-c'
    - |
        source build_flags.env
        if [ "$fren
          cd frontend
          npm ci
          npm run build
          npm run test
        else
     d"
    
    waitFor: ['detect-chans']

al)
  - name: 'python:3.11-slim'
    id: 'build-backend'
    entrypoint: 'bash'
    gs:
      - '-c'
      - |
        source build_flags.env
        if [ "$backend" = "
         d
     .txt
    test
          python -m flak
        else

        fi
    waitFor: ['detect-changes']

  # Build API (conditional)
  -lpine'

   
    args:
      - '-c'
     - |
        source build_flags.env
        if [ "$api" = "true" ]; then
          cd api
          go mod download
          go test ./...
i .
        else          echo "API unchanged, skipping build"   fi    waissystemon notificatid nitoring angrated moe  
✅ Inteelinpipthe to nce inlia companning andty scilt securi Buows  
✅yment workfl and deploriggersautomated tished 
✅ Establtasks  ized ecialrs for sptom buildeted cuson  
✅ Crealel executiith paralrns wpatteced build dvanmplemented anes  
✅ Iipeli/CD prless CIve servemprehensiup co
✅ Set ved:** Achie You've.

**Whatplicationstive ap-narn cloudt for modeecd Build perf Clouakeses muruild feat bvanced, and adonP integratieep GC dre,architectuless on of server combinatiment

Theecret manageing and sin scann with built-chapproay-first** **Securitxecution
-  parallel end scaling a automaticds** with buil**Scalablegistry
- ifact Rertd Ad Run, anlouGKE, Cices like  serv withgration** inteeep GCP*Dagement
- *tructure mant infras withous CI/CD**erverles
- **Seed:
u nild when yoose Cloud BuChoform. atloud Plon Google C* I/CD*native Cor **cloud-l choice** f**idea the isuild le Cloud Bon

Googsi

## Conclus

---guration confipts andconce-specific GCPCurve**: **Learning  builds
- olumee for high-vxpensiv**: Can be ens
- **Costtiohosted solulf-ible than se*: Less flexization*tomLimited Cus
- **rmud Platfooogle Clo Tied to G Lock-in**:**GCP Cons
- ent

### ❌cret managem and sety scanningcurin selt-ie**: BuiSecurvices
- **h GCP serwitration : Deep integegrated** **Intabilities
- capnd cachingxecution aallel e**: Parst **Fauild load
-d on bg base scalintomaticlable**: Aucad
- **Snt require managemeructurestinfraess**: No *Serverl- *### ✅ Pros
& Cons

os --

## Pr0 days)

-last 3ds**: 12 (led Buil- **Faients/day
ploym de*: 3.2t Frequency* **Deploymen*: 6m 42s
-ime*ld Tverage Buiays)
- **A30 d(last 6.8% ate**: 9ld Success Rrd
- **Buioatrics Dashbd Me# Buil
```

## 34s)ly (8mul successfompleted All steps cLD SUCCESS:

BUIrun.appng-xyz-uc.a.p-stagiapmy//tps:ice URL: ht": Servoy-staging11 - "depl
Step #eployed been d01-abc] hasaging-000p-stsion [myapeviing] ragp-st[myap Service y-staging":- "deplo #11  Done.
Stepw service...ploying neg": ✓ Deploy-stagin"de  #11 -g]
Stepginp-stavice [myap Run serClouder to g containDeployin-staging": 1 - "deployStep #1"
agingploy-stde1 - " #1ng StepStarti:a1b2c3d

po/myappct/myapp-remyprojeg.dev/docker.pkentral1-ged us-cully taguccessfage": S"build-im- tep #8 def456
Silt abc123ssfully bucce Suage":-im- "buildtep #8 
S 156.7MBker daemon ocontext to Ding build cge": Sendma"build-iep #8 - -image"
St "build #8 -ting Stepes

Star91.8% branchnts, % statemeerage: 94.2": Cov-unittest5 - "tal
Step # tosed, 127 passts: 127": Teitun "test-p #5 -otal
Ste5 t 1 15 passed,Suites:t": Test "test-uniep #5 - est.tsx
Stts/App.tencomponSS src/": PAst-unitep #5 - "teerage
Stcovt:1.0.0 tesmyapp@t-unit": >  "tes#5 -"
Step it - "test-unting Step #5g!

Starlintines pass  fil": ✨ All#4 - "lint,.tsx
Step .tsxt .js,.jsx,. --e > eslint  - "lint":p #4t
Ste linyapp@1.0.0nt": > m"li #4 - 
Step"intep #4 - "l
Starting Sts in 23s
kage pac47ded 18: adll-deps"nstap #2 - "i
Steed.tions disabl protecdedRecommenng --force  WARN usipml-deps": n- "instal
Step #2 deps"- "install-ng Step #2 Starti MiB.

cts/45.61.2k objeeted over ration compl Ope-cache":restore " -ep #1les...
Stmodu-cache/node_-buildprojectmyg gs://": Copyinhecace-restortep #1 - "cache"
Sestore-ep #1 - "rng Sttarti```bash
Se Output
Consold Build  ClouSee

### You'll  What 🔍--

```bash

-
}
``d_network.id.builpute_networkogle_com go    =  work et n1"
 ntral "us-ce   =n     "
  regio0.0/2410.0.range = "_cidr_ipbnet"
  = "build-sue          amet" {
  n_subn"buildwork" e_subnetle_computoogurce "gresoe
}

alss = ftworkeate_subneo_crrk"
  autetwo"build-n =            me         nak" {
 orild_netw" "bu_networkutempgle_co "gooourcees}
}

r  id
etwork.ork.build_nte_netwogle_compugotwork = ed_ne   peerig {
 work_conf 
  netalse
  }
 nal_ip = fter  no_ex4"
  d--standar  = "e2e hine_typmac   
   = 100_gb ze   disk_siig {
 er_confrk"
  
  woal1"us-centrn = atio"
  locer-pool-work "private     =
  nameol" {"private_por_pool" orkeild_wudbugle_clo "goosourcee builds
re privatol for worker po Buildud

# Clo
}
  } = "true"  LEASE "
    _REductionV = "proEPLOY_EN {
    _Dtitutions =  subs  
se.yaml"
lea-redbuildoue = "clenam 
  fil  }
     }
v.*"
ag = "^  th {
    "
    pusyappname  = "mg"
    r = "myor
    owneub {
  gith"
  loymentsase depreleor  fgerrigiption = "Tr"
  descrtriggease-"rele   = name     e" {
  "releaser" dbuild_trigg"google_clou
resource   }
}

ging"= "staNV    _DEPLOY_E
  {tutions =
  substiyaml"
  oudbuild-pr. "clfilename =
  }
  
   }$"
   inh = "^ma   branc {
   _requestll   pu"myapp"
   name  = "
  g"myor= r   ownethub {
  
  
  giidation"est valqur pull re"Trigger fo= description 
  pr-trigger"   = "  name     " {
uesteq" "pull_rriggerudbuild_t"google_cloesource }
}

r = true
  al_requiredprov
    aponfig {  approval_c
  
"_WITH_STATUSOGSBUILD_LNCLUDE_gs = "Iild_loude_bu incl  
 
  }
al1-a""us-centrZONE   =  _CLUSTER_ster"
   on-cluroducti   = "p_NAME   _CLUSTER1"
 ral-cent   = "usON      
    _REGIapp"E   = "my_NAM_SERVICEon"
    ducti     = "pro_ENVEPLOY= {
    _Dtions substitu
  
  ld.yaml"udbuie = "clofilenam
  
  }
  "
    }n$ = "^mai   branch
     push {app"
  e  = "my  nam"
   "myorg  owner =ithub {
    
  gs"
ch buildran b main"Trigger for = scription"
  dech-trigger"main-bran      =   name  branch" {
" "main_gerild_trigloudbule_curce "goog```hcl
reso:

f`d.tuilorm/cloud-berrafte `t

Creaersiggfor Build Trfiguration  Conorm### Terraf
```

oyment"elease deplption="R--descri" \
    .yamlseleauild-reig="cloudb--build-conf   " \
 v.*ern="^ag-patt--t    \
 yorg"o-owner="m-rep
    -" \myapprepo-name="  --ub \
  create giths triggerds 
gcloud builesor releas trigger fte tag
# Creaation"
idequest val"Pull r=escription
    --dr.yaml" \udbuild-pconfig="cloild-
    --bu" \ain$attern="^ml-request-ppul\
    --" rgmyoer="  --repo-own\
  yapp" ="mo-name --repb \
   ate githurs cres trigged buildger
gclou PR trig
# Createt"
h deploymen"Main brancon=ripti
    --desc \uild.yaml"ig="cloudbconf   --build-" \
 n$rn="^maianch-pattebr\
    --" r="myorgwneepo-o
    --ryapp" \me="m   --repo-na
 \ub threate gi triggers c buildsy
gcloudrepositoritHub 
# Connect G
```bash Triggers
Advanced with ntegration I### GitHubmation

utoand Ars geBuild TrigStep 4: ---

## 📊 

``in()
`ma:
    __"= "__main_name__ =d")

if _mpleten cocaecurity s print("✅ S       
image)
age(    sign_ims:
    _resultyped granivy_results 
    if trpasss f scange i # Sign ima
     
  , indent=2)s, fltn.dump(resu  jso:
       as f', 'w')ults.jsonn-resscarity-h open('secuwit   
        }
 om
m': sb     'sbo  sults,
 pe_re': grype 'gry
       ults,: trivy_restrivy'    '
     image,   'image':= {
     lts 
    resu results # Save    
   e)
e_sbom(imaggenerat
    sbom = rate SBOM # Gene 
   mage)
   grype_scan(its = run_ulres  grype_mage)
  scan(iy_rivn_t = ruesultsvy_r
    triy scansvulnerabilit
    # Run e}")
    agr {im scan fotyecurie snsivg compreheintartrint(f"🚀 S   p
    
 ys.argv[1]age = s
    im
    1)sys.exit(
        >")geima-scan.py <: securitysage print("U     
  gv) != 2:ys.arlen(s   if 
 ef main():

dturn False     re")
   : {e}ng failedsigniage "❌ Imprint(fe:
         as cessErrordProrocess.Callept subpue
    exceturn Tr    relly")
    successfuigned e} s {imagImageprint(f"✅ 
        ck=True)run(cmd, che subprocess.    :
   ry t
    
   age]imIVATE_KEY', _PRenv://COSIGN-key', ' 'sign', '-['cosign',
    cmd = ionduct in proey setup proper kreuld requi   # This wo")
    
 e {image}imaging ️ Signint(f"✍""
    prsign"ith Coge wner imaaiSign cont """):
   image sign_image(None

defeturn   r  ")
    }erriled: {e.stdn fatiogenera❌ SBOM    print(f"
     r as e:cessErro.CalledProocessexcept subpr)
    lt.stdouts(resun.load  return jso     
 ue)k=TrTrue, checue, text=Trt=apture_outpuun(cmd, c.ressbprocult = su      res   try:
  
    
 -o', 'json']', image, 'cmd = ['syft    

    ge}")for {ima SBOM nerating"📋 Ge   print(f""
 erials" of MatBillware Softate "Gener   ""age):
 sbom(imgenerate_None

def n       retur
  err}")tdailed: {e.sype scan fGrnt(f"❌ pri     as e:
   r essErro.CalledProcbprocess   except su)
 outs(result.std json.load return
       =True)ue, checktext=Trutput=True,  capture_on(cmd,ss.ruroceubp= s     result  try:
   
   
    json']', 'mage, '-ope', i cmd = ['gry  
   e}")
  imagn on {caing Grype sf"🔍 Runn   print(
 "y scan""ilitabnervulun Grype  """R:
   image)_scan(run_grype
def eturn None

        rr}") {e.stderiled:n fa Trivy scaprint(f"❌e:
         as rocessErroralledPocess.Ct subpr)
    exceplt.stdoutresuds(rn json.loaetu       rTrue)
 k=e, checru=Tue, textut=Trapture_outpn(cmd, css.ruproceesult = sub  r         try:

    
 mage
    ]
        iCRITICAL','HIGH,y', --severit  ''1',
      it-code',  '--ex     json',
  t', '   '--forma,
     'image'trivy',       '[
     cmd =  
 ")
    on {image}ivy scannning TrRuint(f"🔍 
    pr scan"""erabilityrivy vulnun T    """Ran(image):
n_trivy_scos

def ru
import mport syson
is
import js subproces
importpython3sr/bin/env #!/uython

```pscan.py`:
security-ty-scanner/curi/seilders
Create `bu"]
```
y-scan.pyecurital/bin/sloc"/usr/NTRYPOINT [scan.py

Eity-/securlocal/binr/od +x /usUN chml/bin/
Rusr/locapy /an.rity-sccu ser
COPYscanneurity ustom secall cgn

# Instsibin/co/local/mod +x /usr
    chosign && \/local/bin/c /usrnux-amd64osign-li  mv c && \
  inux-amd64"n-l/cosigoad/downlestat/lign/releasessigstore/costhub.com/ttps://gi-O -L "hn
RUN curl  Cosig
# Install
inl/bca-b /usr/lo | sh -s -- install.shain/hore/syft/ment.com/ancrcontuseubgith/raw.https:/ -sSfL t
RUN curlyfll S

# Instaal/bin/usr/loc- -b  -h -s | sall.shmain/instype/m/anchore/grntent.cohubusercoraw.git://-sSfL httpsrl e
RUN cul Gryp

# Instal/local/bins -- -b /usrsh -all.sh | ontrib/instivy/main/curity/truaseccom/aqnt.buserconte.githutps://rawcurl -sfL htivy
RUN Install Try3-pip

#    pn3 \
  pytho      git \
jq \
 
    ash \l \
    b  curcache \
  --no-d RUN apk ady tools
 securit
# Install
lpine:latestFROM ae
erfil

```dockockerfile`:ner/Dscanecurity-ilders/ste `bueaCring

ity Scannvanced Securlder for Adui### Custom B`

']
``ild-apickend', 'bu-ba', 'build-frontend: ['buildaitFor    w    fi
T_SHA
    api:$COMMIECT_ID/o/$PROJ push gcr.i    dockerpi/
      MMIT_SHA aID/api:$CO$PROJECT_o/gcr.iild -t er buck      do then
    ]; = "true" "$api"    if [   
  
        
        fiT_SHA$COMMInd:_ID/backeo/$PROJECTush gcr.i  docker p    nd/
    _SHA backeMMITkend:$COD/bac_Iio/$PROJECT -t gcr. build  docker    then
     " ];" = "truend$backe  if [ "  
    fi
        A
        SH:$COMMIT_/frontend/$PROJECT_IDr.ior push gc     docke  d/
   HA frontenIT_Snd:$COMMonteROJECT_ID/frio/$Pild -t gcr.   docker bu       n
" ]; the" = "truend "$fronte      if [  
        v
gs.ene build_fla    sourc    - |
     c'
  - '-       args:

  t: 'bash'ntrypoin
    emages'd-iid: 'buil   '
 ckerdod-builders/cr.io/clou- name: 'gnal)
  onditioimages (cild Docker  # Bu

 nges']ct-cha['detetFor: 

     
