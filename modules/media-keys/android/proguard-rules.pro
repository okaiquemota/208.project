# Regras do R8 que valem para o app que usa este módulo (consumerProguardFiles).
#
# O build de release minifica o código. O SDK do Spotify (App Remote) monta e
# lê as mensagens trocadas com o app do Spotify por reflexão (Gson): se o R8
# renomear ou apagar campos dessas classes, as listas chegam vazias ou a
# conexão falha sem erro claro. O SDK é pequeno, então mantemos ele inteiro.
-keep class com.spotify.protocol.** { *; }
-keep class com.spotify.android.appremote.** { *; }
-dontwarn com.spotify.**
-keepattributes Signature, *Annotation*, InnerClasses, EnclosingMethod
